import { reactive, ref, shallowRef } from 'vue';
import type {
  TelemetryEvent,
  MetricSnapshot,
  TimeSeriesBucket,
  GeoRegion,
  ScenarioMode,
  SimulationChaosState,
  StatusCode,
  FunnelStage,
} from '../types/analytics';
import { GEO_LOCATIONS, SCENARIO_ENDPOINTS } from './dataPresets';
import { alertEngine } from './alertEngine';

const MAX_EVENT_BUFFER = 500;
const MAX_TIME_SERIES_BUCKETS = 60; // 60 seconds rolling window

class StreamEngine {
  // Reactive state
  public isRunning = ref<boolean>(true);
  public speedMultiplier = ref<number>(5); // 5x (~10 events/sec) default
  public scenario = ref<ScenarioMode>('ecommerce');

  // Ring buffer for raw events
  public recentEvents = shallowRef<TelemetryEvent[]>([]);
  public totalIngested = ref<number>(0);

  // Time series rolling buckets
  public timeSeriesBuckets = shallowRef<TimeSeriesBucket[]>([]);

  // Current live snapshot
  public currentSnapshot = reactive<MetricSnapshot>({
    timestamp: Date.now(),
    eventsPerSec: 0,
    activeUsers: 0,
    avgLatencyMs: 0,
    p95LatencyMs: 0,
    p99LatencyMs: 0,
    errorRatePercent: 0,
    successRatePercent: 100,
    totalIngested: 0,
    throughputKbps: 0,
  });

  // Chaos & simulation state
  public chaos = reactive<SimulationChaosState>({
    latencySurgeActive: false,
    errorSpikeActive: false,
    ddosSpikeActive: false,
    customInjectionCount: 0,
  });

  // Aggregated breakdowns
  public geoBreakdown = shallowRef<GeoRegion[]>([]);
  public statusBreakdown = shallowRef<Record<string, number>>({});
  public deviceBreakdown = shallowRef<Record<string, number>>({ desktop: 0, mobile: 0, tablet: 0 });
  public browserBreakdown = shallowRef<Record<string, number>>({ Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Other: 0 });
  public funnelStages = shallowRef<FunnelStage[]>([]);

  private loopInterval: any = null;
  private tickerInterval: any = null;
  private currentSecondEvents: TelemetryEvent[] = [];
  private activeUserSet = new Set<string>();

  constructor() {
    this.initBuckets();
    this.seedInitialData();
  }

  private seedInitialData() {
    // Pre-populate with realistic events so dashboard is immediately vibrant
    for (let i = 0; i < 35; i++) {
      const evt = this.createSyntheticEvent();
      this.totalIngested.value++;
      this.recentEvents.value.push(evt);
      this.activeUserSet.add(evt.userId);
    }
    this.calculateBreakdowns();
  }

  private initBuckets() {
    const now = Date.now();
    const buckets: TimeSeriesBucket[] = [];
    for (let i = MAX_TIME_SERIES_BUCKETS; i >= 1; i--) {
      const t = now - i * 1000;
      const d = new Date(t);
      buckets.push({
        timestamp: t,
        label: `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`,
        count: 0,
        avgLatency: 0,
        p95Latency: 0,
        errorCount: 0,
      });
    }
    this.timeSeriesBuckets.value = buckets;
  }

  public start() {
    if (this.loopInterval) return;

    // Event generation loop: runs every 50ms, generates batches based on speed
    this.loopInterval = setInterval(() => {
      if (!this.isRunning.value) return;
      this.generateTickEvents();
    }, 50);

    // 1-second aggregation ticker
    this.tickerInterval = setInterval(() => {
      this.aggregateSecondBucket();
    }, 1000);
  }

  public stop() {
    if (this.loopInterval) clearInterval(this.loopInterval);
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    this.loopInterval = null;
    this.tickerInterval = null;
  }

  public toggleRunning() {
    this.isRunning.value = !this.isRunning.value;
  }

  public setSpeed(multiplier: number) {
    this.speedMultiplier.value = multiplier;
  }

  public setScenario(s: ScenarioMode) {
    this.scenario.value = s;
  }

  // Chaos injection triggers
  public toggleLatencySurge() {
    this.chaos.latencySurgeActive = !this.chaos.latencySurgeActive;
  }

  public toggleErrorSpike() {
    this.chaos.errorSpikeActive = !this.chaos.errorSpikeActive;
  }

  public triggerDdosSpike() {
    this.chaos.ddosSpikeActive = true;
    setTimeout(() => {
      this.chaos.ddosSpikeActive = false;
    }, 6000); // 6-second spike
  }

  public ingestCustomEvent(custom: Partial<TelemetryEvent>) {
    const now = Date.now();
    const loc = GEO_LOCATIONS[Math.floor(Math.random() * GEO_LOCATIONS.length)];
    const evt: TelemetryEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      type: custom.type || 'custom',
      endpoint: custom.endpoint || '/custom/telemetry-hook',
      method: custom.method || 'POST',
      statusCode: (custom.statusCode || 200) as StatusCode,
      latencyMs: custom.latencyMs ?? Math.floor(Math.random() * 60 + 20),
      bytes: custom.bytes ?? Math.floor(Math.random() * 2048 + 512),
      userId: custom.userId || `usr_${Math.floor(Math.random() * 9000 + 1000)}`,
      country: custom.country || loc.country,
      countryCode: custom.countryCode || loc.countryCode,
      city: custom.city || loc.city,
      lat: custom.lat ?? loc.lat,
      lng: custom.lng ?? loc.lng,
      browser: custom.browser || 'Chrome',
      device: custom.device || 'desktop',
      payload: custom.payload || { source: 'custom_injection', traceId: `tr_${Date.now()}` },
    };

    this.processSingleEvent(evt);
    this.chaos.customInjectionCount++;
  }

  private generateTickEvents() {
    // Determine how many events to generate this 50ms tick
    // Base rate: 2 events/sec at 1x => 0.1 per tick. With probability.
    const ratePerSecond = this.speedMultiplier.value * 2 * (this.chaos.ddosSpikeActive ? 5 : 1);
    const expectedEventsPer50ms = (ratePerSecond / 1000) * 50;

    let eventsToProduce = Math.floor(expectedEventsPer50ms);
    if (Math.random() < expectedEventsPer50ms - eventsToProduce) {
      eventsToProduce += 1;
    }

    if (eventsToProduce === 0) return;

    for (let i = 0; i < eventsToProduce; i++) {
      const evt = this.createSyntheticEvent();
      this.processSingleEvent(evt);
    }
  }

  private createSyntheticEvent(): TelemetryEvent {
    const endpoints = SCENARIO_ENDPOINTS[this.scenario.value];
    const ep = endpoints[Math.floor(Math.random() * endpoints.length)];

    // Weighted geo picker
    const rand = Math.random() * 150;
    let accumulated = 0;
    let geo = GEO_LOCATIONS[0];
    for (const g of GEO_LOCATIONS) {
      accumulated += g.weight;
      if (rand <= accumulated) {
        geo = g;
        break;
      }
    }

    // Determine latency
    let latency = ep.baseLatency + (Math.random() * ep.variance * 2 - ep.variance);
    if (this.chaos.latencySurgeActive) {
      latency += 450 + Math.random() * 400; // Major lag injection
    }
    latency = Math.max(8, Math.round(latency));

    // Determine status code
    let errorProb = ep.errorProbability;
    if (this.chaos.errorSpikeActive) {
      errorProb = 0.45; // 45% error rate injection
    }

    let statusCode: StatusCode = 200;
    let type = ep.type;

    if (Math.random() < errorProb) {
      const errorCodes: StatusCode[] = [500, 502, 503, 400, 404, 429];
      statusCode = errorCodes[Math.floor(Math.random() * errorCodes.length)];
      if (statusCode >= 500) {
        type = 'error';
      }
    } else {
      if (ep.method === 'POST') {
        statusCode = Math.random() > 0.1 ? 201 : 200;
      }
    }

    const browsers: ('Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other')[] = ['Chrome', 'Chrome', 'Safari', 'Firefox', 'Edge'];
    const devices: ('desktop' | 'mobile' | 'tablet')[] = ['desktop', 'desktop', 'mobile', 'mobile', 'tablet'];
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];

    const userNumber = Math.floor(Math.random() * 250 + 100);
    const userId = `u_${userNumber}`;

    const now = Date.now();

    return {
      id: `evt_${now.toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      type,
      endpoint: ep.path,
      method: ep.method,
      statusCode,
      latencyMs: latency,
      bytes: Math.floor(Math.random() * 3500 + 400),
      userId,
      country: geo.country,
      countryCode: geo.countryCode,
      city: geo.city,
      lat: geo.lat + (Math.random() * 0.4 - 0.2),
      lng: geo.lng + (Math.random() * 0.4 - 0.2),
      browser,
      device,
      payload: {
        scenario: this.scenario.value,
        clientIp: `${Math.floor(Math.random() * 180 + 20)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.1`,
        protocol: 'HTTP/2.0',
        ssl: true,
      },
    };
  }

  private processSingleEvent(evt: TelemetryEvent) {
    this.totalIngested.value++;
    this.currentSecondEvents.push(evt);
    this.activeUserSet.add(evt.userId);

    // Prepend to ring buffer (shallowRef update in batches or trimmed)
    const nextEvents = [evt, ...this.recentEvents.value.slice(0, MAX_EVENT_BUFFER - 1)];
    this.recentEvents.value = nextEvents;
  }

  private aggregateSecondBucket() {
    const events = this.currentSecondEvents;
    this.currentSecondEvents = [];

    const now = Date.now();
    const d = new Date(now);
    const label = `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

    const count = events.length;
    let avgLatency = 0;
    let p95Latency = 0;
    let p99Latency = 0;
    let errorCount = 0;
    let totalBytes = 0;

    if (count > 0) {
      const latencies = events.map(e => e.latencyMs).sort((a, b) => a - b);
      const sumLatency = latencies.reduce((a, b) => a + b, 0);
      avgLatency = Math.round(sumLatency / count);

      const p95Idx = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95));
      const p99Idx = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.99));
      p95Latency = latencies[p95Idx];
      p99Latency = latencies[p99Idx];

      errorCount = events.filter(e => e.statusCode >= 400).length;
      totalBytes = events.reduce((sum, e) => sum + e.bytes, 0);
    } else {
      // Retain last known latency or decay
      avgLatency = Math.round(this.currentSnapshot.avgLatencyMs * 0.9);
      p95Latency = Math.round(this.currentSnapshot.p95LatencyMs * 0.9);
      p99Latency = Math.round(this.currentSnapshot.p99LatencyMs * 0.9);
    }

    const errorRate = count > 0 ? (errorCount / count) * 100 : 0;
    const throughputKbps = (totalBytes * 8) / 1024; // kilobits/sec

    // Update rolling buckets
    const newBucket: TimeSeriesBucket = {
      timestamp: now,
      label,
      count,
      avgLatency,
      p95Latency,
      errorCount,
    };

    const nextBuckets = [...this.timeSeriesBuckets.value.slice(1), newBucket];
    this.timeSeriesBuckets.value = nextBuckets;

    // Update active snapshot
    this.currentSnapshot.timestamp = now;
    this.currentSnapshot.eventsPerSec = count;
    this.currentSnapshot.activeUsers = this.activeUserSet.size;
    this.currentSnapshot.avgLatencyMs = avgLatency;
    this.currentSnapshot.p95LatencyMs = p95Latency;
    this.currentSnapshot.p99LatencyMs = p99Latency;
    this.currentSnapshot.errorRatePercent = Number(errorRate.toFixed(1));
    this.currentSnapshot.successRatePercent = Number((100 - errorRate).toFixed(1));
    this.currentSnapshot.totalIngested = this.totalIngested.value;
    this.currentSnapshot.throughputKbps = Number(throughputKbps.toFixed(1));

    // Gradually decay active users set so it reflects recent traffic
    if (this.activeUserSet.size > 200) {
      const arr = Array.from(this.activeUserSet);
      this.activeUserSet = new Set(arr.slice(arr.length - 120));
    }

    // Refresh aggregated breakdowns from recent buffer
    this.calculateBreakdowns();

    // Trigger alerts check
    alertEngine.evaluateMetrics(this.currentSnapshot);
  }

  private calculateBreakdowns() {
    const list = this.recentEvents.value;
    if (list.length === 0) return;

    // 1. Geo Breakdown
    const geoMap = new Map<string, GeoRegion>();
    for (const g of GEO_LOCATIONS) {
      geoMap.set(g.countryCode, {
        code: g.countryCode,
        name: g.country,
        lat: g.lat,
        lng: g.lng,
        eventCount: 0,
        avgLatency: 0,
        errorCount: 0,
      });
    }

    const geoLatencySums = new Map<string, number>();

    // 2. Status codes
    const statusObj: Record<string, number> = {};

    // 3. Devices & Browsers
    const devices: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    const browsers: Record<string, number> = { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Other: 0 };

    // 4. Funnel steps
    let pageviews = 0;
    let searches = 0;
    let cartAdds = 0;
    let checkouts = 0;
    let payments = 0;

    for (const evt of list) {
      // Geo
      const reg = geoMap.get(evt.countryCode);
      if (reg) {
        reg.eventCount++;
        if (evt.statusCode >= 400) reg.errorCount++;
        geoLatencySums.set(evt.countryCode, (geoLatencySums.get(evt.countryCode) || 0) + evt.latencyMs);
      }

      // Status
      const sc = String(evt.statusCode);
      statusObj[sc] = (statusObj[sc] || 0) + 1;

      // Device
      devices[evt.device] = (devices[evt.device] || 0) + 1;

      // Browser
      browsers[evt.browser] = (browsers[evt.browser] || 0) + 1;

      // Funnel
      if (evt.endpoint.includes('catalog') || evt.type === 'pageview') pageviews++;
      if (evt.endpoint.includes('search')) searches++;
      if (evt.endpoint.includes('cart')) cartAdds++;
      if (evt.endpoint.includes('checkout') && evt.method === 'GET') checkouts++;
      if (evt.endpoint.includes('pay') || evt.type === 'checkout') payments++;
    }

    // Compute average latencies for geo
    const geoArr: GeoRegion[] = [];
    for (const [code, reg] of geoMap.entries()) {
      if (reg.eventCount > 0) {
        reg.avgLatency = Math.round((geoLatencySums.get(code) || 0) / reg.eventCount);
      }
      geoArr.push(reg);
    }
    geoArr.sort((a, b) => b.eventCount - a.eventCount);
    this.geoBreakdown.value = geoArr;

    this.statusBreakdown.value = statusObj;
    this.deviceBreakdown.value = devices;
    this.browserBreakdown.value = browsers;

    // Dynamic scenario-specific funnel stages
    const total = Math.max(1, list.length);
    if (this.scenario.value === 'ecommerce') {
      const p1 = Math.round(total * 0.95);
      const p2 = Math.round(p1 * 0.72);
      const p3 = Math.round(p2 * 0.58);
      const p4 = Math.round(p3 * 0.44);
      const p5 = Math.round(p4 * 0.82);
      this.funnelStages.value = [
        { name: 'Catalog Browse', key: 'browse', count: p1, conversionPercent: 100, dropoffPercent: 0 },
        { name: 'Product Search', key: 'search', count: p2, conversionPercent: 72, dropoffPercent: 28 },
        { name: 'Added to Cart', key: 'cart', count: p3, conversionPercent: 42, dropoffPercent: 58 },
        { name: 'Initiated Checkout', key: 'checkout', count: p4, conversionPercent: 18, dropoffPercent: 82 },
        { name: 'Completed Payment', key: 'payment', count: p5, conversionPercent: 15, dropoffPercent: 85 },
      ];
    } else if (this.scenario.value === 'fintech') {
      this.funnelStages.value = [
        { name: 'Balance & Rates', key: 'rates', count: total, conversionPercent: 100, dropoffPercent: 0 },
        { name: 'KYC Identity Check', key: 'kyc', count: Math.round(total * 0.84), conversionPercent: 84, dropoffPercent: 16 },
        { name: 'Risk Scoring', key: 'fraud', count: Math.round(total * 0.78), conversionPercent: 78, dropoffPercent: 22 },
        { name: 'Card Authorization', key: 'card', count: Math.round(total * 0.65), conversionPercent: 65, dropoffPercent: 35 },
        { name: 'Transfer Settled', key: 'settled', count: Math.round(total * 0.61), conversionPercent: 61, dropoffPercent: 39 },
      ];
    } else if (this.scenario.value === 'saas') {
      this.funnelStages.value = [
        { name: 'OAuth Authenticated', key: 'auth', count: total, conversionPercent: 100, dropoffPercent: 0 },
        { name: 'Team Workspace', key: 'team', count: Math.round(total * 0.88), conversionPercent: 88, dropoffPercent: 12 },
        { name: 'GraphQL Query', key: 'gql', count: Math.round(total * 0.76), conversionPercent: 76, dropoffPercent: 24 },
        { name: 'Webhook Dispatch', key: 'webhook', count: Math.round(total * 0.68), conversionPercent: 68, dropoffPercent: 32 },
        { name: 'Deploy Triggered', key: 'deploy', count: Math.round(total * 0.42), conversionPercent: 42, dropoffPercent: 58 },
      ];
    } else {
      this.funnelStages.value = [
        { name: 'Ingress Packet', key: 'ingress', count: total, conversionPercent: 100, dropoffPercent: 0 },
        { name: 'WAF Inspection', key: 'waf', count: Math.round(total * 0.94), conversionPercent: 94, dropoffPercent: 6 },
        { name: 'Firewall Policy', key: 'firewall', count: Math.round(total * 0.86), conversionPercent: 86, dropoffPercent: 14 },
        { name: 'Token Validated', key: 'token', count: Math.round(total * 0.62), conversionPercent: 62, dropoffPercent: 38 },
        { name: 'Access Granted', key: 'auth', count: Math.round(total * 0.58), conversionPercent: 58, dropoffPercent: 42 },
      ];
    }
  }

  // Export data
  public exportJSON(): string {
    return JSON.stringify(this.recentEvents.value, null, 2);
  }

  public exportCSV(): string {
    const list = this.recentEvents.value;
    if (list.length === 0) return '';
    const headers = ['id', 'timestamp', 'type', 'method', 'endpoint', 'statusCode', 'latencyMs', 'bytes', 'country', 'city', 'browser', 'device'];
    const rows = list.map(e => [
      e.id,
      e.timestamp,
      e.type,
      e.method,
      `"${e.endpoint}"`,
      e.statusCode,
      e.latencyMs,
      e.bytes,
      `"${e.country}"`,
      `"${e.city}"`,
      e.browser,
      e.device,
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  public clearBuffer() {
    this.recentEvents.value = [];
    this.totalIngested.value = 0;
  }
}

export const streamEngine = new StreamEngine();


export type EventType = 'pageview' | 'api_call' | 'checkout' | 'auth' | 'error' | 'custom';

export type StatusCode = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 429 | 500 | 502 | 503;

export type ScenarioMode = 'ecommerce' | 'fintech' | 'saas' | 'security';

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  type: EventType;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  statusCode: StatusCode;
  latencyMs: number;
  bytes: number;
  userId: string;
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lng: number;
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other';
  device: 'desktop' | 'mobile' | 'tablet';
  payload?: Record<string, any>;
}

export interface MetricSnapshot {
  timestamp: number;
  eventsPerSec: number;
  activeUsers: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  successRatePercent: number;
  totalIngested: number;
  throughputKbps: number;
}

export interface TimeSeriesBucket {
  timestamp: number;
  label: string;
  count: number;
  avgLatency: number;
  p95Latency: number;
  errorCount: number;
}

export interface GeoRegion {
  code: string;
  name: string;
  lat: number;
  lng: number;
  eventCount: number;
  avgLatency: number;
  errorCount: number;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertRule {
  id: string;
  name: string;
  metric: 'latency_p95' | 'error_rate' | 'rps';
  operator: 'gt' | 'lt';
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  description: string;
}

export interface AlertIncident {
  id: string;
  ruleId: string;
  title: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: AlertSeverity;
  timestamp: number;
  status: 'active' | 'resolved';
}

export interface FunnelStage {
  name: string;
  key: string;
  count: number;
  conversionPercent: number;
  dropoffPercent: number;
}

export interface SimulationChaosState {
  latencySurgeActive: boolean;
  errorSpikeActive: boolean;
  ddosSpikeActive: boolean;
  customInjectionCount: number;
}

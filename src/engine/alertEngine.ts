import { reactive, ref, shallowRef } from 'vue';
import type { AlertRule, AlertIncident, MetricSnapshot } from '../types/analytics';
import { soundFx } from '../utils/audio';

class AlertEngine {
  public rules = reactive<AlertRule[]>([
    {
      id: 'rule_latency',
      name: 'High P95 Latency Spike',
      metric: 'latency_p95',
      operator: 'gt',
      threshold: 350, // ms
      severity: 'critical',
      enabled: true,
      description: 'Triggers when P95 latency exceeds 350ms across the rolling window.',
    },
    {
      id: 'rule_error_rate',
      name: 'Elevated 5xx/4xx Error Rate',
      metric: 'error_rate',
      operator: 'gt',
      threshold: 8, // percent
      severity: 'warning',
      enabled: true,
      description: 'Triggers when failure rate exceeds 8% of total ingested events.',
    },
    {
      id: 'rule_rps_spike',
      name: 'High Influx Traffic Surge',
      metric: 'rps',
      operator: 'gt',
      threshold: 60, // events/sec
      severity: 'info',
      enabled: true,
      description: 'Notifies when event throughput exceeds 60 events/second.',
    },
  ]);

  public activeIncidents = shallowRef<AlertIncident[]>([]);
  public incidentHistory = shallowRef<AlertIncident[]>([]);
  public audioAlertsEnabled = ref<boolean>(false);

  public toggleAudio() {
    this.audioAlertsEnabled.value = !this.audioAlertsEnabled.value;
    soundFx.enabled = this.audioAlertsEnabled.value;
  }

  public toggleRule(id: string) {
    const r = this.rules.find(x => x.id === id);
    if (r) r.enabled = !r.enabled;
  }

  public updateRuleThreshold(id: string, newThreshold: number) {
    const r = this.rules.find(x => x.id === id);
    if (r) r.threshold = newThreshold;
  }

  public evaluateMetrics(snapshot: MetricSnapshot) {
    const currentActive: AlertIncident[] = [];
    const now = Date.now();

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      let val = 0;
      if (rule.metric === 'latency_p95') val = snapshot.p95LatencyMs;
      else if (rule.metric === 'error_rate') val = snapshot.errorRatePercent;
      else if (rule.metric === 'rps') val = snapshot.eventsPerSec;

      const isBreached = rule.operator === 'gt' ? val > rule.threshold : val < rule.threshold;

      const existingActive = this.activeIncidents.value.find(inc => inc.ruleId === rule.id);

      if (isBreached) {
        if (!existingActive) {
          // New incident triggered!
          const incident: AlertIncident = {
            id: `inc_${now}_${rule.id}`,
            ruleId: rule.id,
            title: rule.name,
            metric: rule.metric,
            currentValue: val,
            threshold: rule.threshold,
            severity: rule.severity,
            timestamp: now,
            status: 'active',
          };
          currentActive.push(incident);
          soundFx.playAlert(rule.severity === 'critical' ? 'critical' : 'warning');
        } else {
          // Still active, update current value
          existingActive.currentValue = val;
          currentActive.push(existingActive);
        }
      } else {
        if (existingActive) {
          // Incident resolved!
          existingActive.status = 'resolved';
          this.incidentHistory.value = [existingActive, ...this.incidentHistory.value.slice(0, 49)];
          soundFx.playResolve();
        }
      }
    }

    this.activeIncidents.value = currentActive;
  }

  public acknowledgeIncident(id: string) {
    this.activeIncidents.value = this.activeIncidents.value.filter(inc => inc.id !== id);
  }

  public clearHistory() {
    this.incidentHistory.value = [];
  }
}

export const alertEngine = new AlertEngine();

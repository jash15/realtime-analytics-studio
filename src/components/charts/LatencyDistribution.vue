<script setup lang="ts">
import { computed } from 'vue';
import { BarChart3, CheckCircle2 } from 'lucide-vue-next';
import { streamEngine } from '../../engine/streamEngine';

interface LatencyBin {
  label: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
  color: string;
}

const bins = computed<LatencyBin[]>(() => {
  const events = streamEngine.recentEvents.value;
  const total = events.length || 1;

  const rawBins = [
    { label: '<50ms', min: 0, max: 50, count: 0, color: 'bg-emerald-500' },
    { label: '50-100ms', min: 50, max: 100, count: 0, color: 'bg-emerald-400' },
    { label: '100-250ms', min: 100, max: 250, count: 0, color: 'bg-cyan-500' },
    { label: '250-500ms', min: 250, max: 500, count: 0, color: 'bg-amber-500' },
    { label: '500-1000ms', min: 500, max: 1000, count: 0, color: 'bg-orange-500' },
    { label: '>1s', min: 1000, max: Infinity, count: 0, color: 'bg-rose-500' },
  ];

  for (const e of events) {
    for (const b of rawBins) {
      if (e.latencyMs >= b.min && e.latencyMs < b.max) {
        b.count++;
        break;
      }
    }
  }

  return rawBins.map(b => ({
    ...b,
    percentage: Math.round((b.count / total) * 100),
  }));
});

const maxBinCount = computed(() => {
  return Math.max(...bins.value.map(b => b.count), 1);
});

// % of requests meeting SLA (<300ms)
const slaCompliance = computed(() => {
  const events = streamEngine.recentEvents.value;
  if (events.length === 0) return 100;
  const compliant = events.filter(e => e.latencyMs <= 300).length;
  return Number(((compliant / events.length) * 100).toFixed(1));
});
</script>

<template>
  <div class="rounded-2xl bg-dark-900/80 border border-dark-800 p-4 lg:p-5 flex flex-col justify-between">
    <div>
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-brand-violet/10 text-brand-violet border border-brand-violet/20">
            <BarChart3 class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-white tracking-tight">Latency Distribution</h2>
            <p class="text-xs text-slate-400">Response time profile</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>{{ slaCompliance }}% SLA</span>
        </div>
      </div>

      <!-- Histogram Bars -->
      <div class="space-y-2 mt-4">
        <div v-for="bin in bins" :key="bin.label" class="text-xs font-mono">
          <div class="flex justify-between text-slate-400 text-[11px] mb-1">
            <span>{{ bin.label }}</span>
            <span class="text-slate-300 font-semibold">{{ bin.count }} ({{ bin.percentage }}%)</span>
          </div>
          <div class="w-full bg-dark-950 h-2 rounded-full overflow-hidden">
            <div
              :class="['h-full rounded-full transition-all duration-300', bin.color]"
              :style="{ width: `${Math.max(2, (bin.count / maxBinCount) * 100)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom summary note -->
    <div class="mt-4 pt-3 border-t border-dark-800 text-[11px] text-slate-500 flex items-center justify-between font-mono">
      <span>Target SLA: &lt;300ms</span>
      <span>Window: Last 500 events</span>
    </div>
  </div>
</template>

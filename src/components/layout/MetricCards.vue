<script setup lang="ts">
import { computed } from 'vue';
import {
  Zap,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
} from 'lucide-vue-next';
import { streamEngine } from '../../engine/streamEngine';
import { formatNumber, formatLatency, formatThroughput } from '../../utils/formatters';

const snap = computed(() => streamEngine.currentSnapshot);

const buckets = computed(() => streamEngine.timeSeriesBuckets.value);

// Compute 10-point mini sparkline SVG path
const rpsSparkline = computed(() => {
  const points = buckets.value.slice(-15);
  if (points.length < 2) return '';
  const max = Math.max(...points.map(p => p.count), 10);
  const w = 80;
  const h = 24;
  return points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - (p.count / max) * (h - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
});

const latencySparkline = computed(() => {
  const points = buckets.value.slice(-15);
  if (points.length < 2) return '';
  const max = Math.max(...points.map(p => p.p95Latency), 100);
  const w = 80;
  const h = 24;
  return points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - (p.p95Latency / max) * (h - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
});

const errorSparkline = computed(() => {
  const points = buckets.value.slice(-15);
  if (points.length < 2) return '';
  const max = Math.max(...points.map(p => p.errorCount), 4);
  const w = 80;
  const h = 24;
  return points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - (p.errorCount / max) * (h - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
});

const apdexStatus = computed(() => {
  const p95 = snap.value.p95LatencyMs;
  if (p95 < 120) return { label: 'Optimal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  if (p95 < 300) return { label: 'Good', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
  if (p95 < 600) return { label: 'Degraded', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  return { label: 'Critical Lag', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
});
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- 1. Throughput / Ingestion Card -->
    <div class="relative overflow-hidden rounded-2xl bg-dark-900/80 border border-dark-800 p-4 transition-all hover:border-dark-700 group">
      <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-brand-cyan/5 blur-2xl group-hover:bg-brand-cyan/10 transition-colors"></div>
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <Zap class="w-4 h-4 text-brand-cyan" />
          Ingestion Throughput
        </span>
        <svg class="w-20 h-6 overflow-visible" viewBox="0 0 80 24">
          <path :d="rpsSparkline" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <div class="flex items-baseline justify-between mt-1">
        <div>
          <span class="text-3xl font-extrabold tracking-tight font-mono text-white">
            {{ snap.eventsPerSec }}
          </span>
          <span class="ml-1 text-xs text-slate-400 font-mono">eps</span>
        </div>
        <div class="text-right">
          <span class="text-xs font-mono text-slate-400">Total</span>
          <div class="text-sm font-semibold font-mono text-slate-200">
            {{ formatNumber(snap.totalIngested) }}
          </div>
        </div>
      </div>

      <div class="mt-3 pt-2.5 border-t border-dark-800 flex items-center justify-between text-[11px] text-slate-400">
        <span class="flex items-center gap-1 text-emerald-400">
          <TrendingUp class="w-3.5 h-3.5" />
          Rolling 60s window
        </span>
        <span class="font-mono text-slate-400">{{ formatThroughput(snap.throughputKbps) }}</span>
      </div>
    </div>

    <!-- 2. P95 & Avg Latency Card -->
    <div
      class="relative overflow-hidden rounded-2xl bg-dark-900/80 border p-4 transition-all group"
      :class="snap.p95LatencyMs > 400 ? 'border-amber-500/40 shadow-lg shadow-amber-500/5' : 'border-dark-800 hover:border-dark-700'"
    >
      <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-brand-emerald/5 blur-2xl group-hover:bg-brand-emerald/10 transition-colors"></div>
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <Clock class="w-4 h-4 text-brand-emerald" />
          P95 Response Latency
        </span>
        <svg class="w-20 h-6 overflow-visible" viewBox="0 0 80 24">
          <path :d="latencySparkline" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <div class="flex items-baseline justify-between mt-1">
        <div>
          <span class="text-3xl font-extrabold tracking-tight font-mono text-white">
            {{ snap.p95LatencyMs }}
          </span>
          <span class="ml-1 text-xs text-slate-400 font-mono">ms</span>
        </div>
        <div class="text-right">
          <span class="text-xs font-mono text-slate-400">Avg</span>
          <div class="text-sm font-semibold font-mono text-slate-200">
            {{ snap.avgLatencyMs }} ms
          </div>
        </div>
      </div>

      <div class="mt-3 pt-2.5 border-t border-dark-800 flex items-center justify-between text-[11px]">
        <span class="text-slate-400">P99: <strong class="text-slate-300 font-mono">{{ snap.p99LatencyMs }}ms</strong></span>
        <span :class="['px-2 py-0.5 rounded-full text-[10px] font-medium border font-mono', apdexStatus.color]">
          {{ apdexStatus.label }}
        </span>
      </div>
    </div>

    <!-- 3. Error Rate & Pipeline Health Card -->
    <div
      class="relative overflow-hidden rounded-2xl bg-dark-900/80 border p-4 transition-all group"
      :class="snap.errorRatePercent >= 5 ? 'border-rose-500/50 shadow-lg shadow-rose-500/10' : 'border-dark-800 hover:border-dark-700'"
    >
      <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-brand-rose/5 blur-2xl group-hover:bg-brand-rose/10 transition-colors"></div>
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <AlertTriangle class="w-4 h-4 text-brand-rose" />
          Pipeline Failure Rate
        </span>
        <svg class="w-20 h-6 overflow-visible" viewBox="0 0 80 24">
          <path :d="errorSparkline" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <div class="flex items-baseline justify-between mt-1">
        <div>
          <span
            class="text-3xl font-extrabold tracking-tight font-mono"
            :class="snap.errorRatePercent >= 5 ? 'text-rose-400' : 'text-white'"
          >
            {{ snap.errorRatePercent }}%
          </span>
        </div>
        <div class="text-right">
          <span class="text-xs font-mono text-slate-400">Success</span>
          <div class="text-sm font-semibold font-mono text-emerald-400">
            {{ snap.successRatePercent }}%
          </div>
        </div>
      </div>

      <div class="mt-3 pt-2.5 border-t border-dark-800 flex items-center justify-between text-[11px] text-slate-400">
        <span class="flex items-center gap-1" :class="snap.errorRatePercent >= 5 ? 'text-rose-400' : 'text-emerald-400'">
          <ShieldCheck class="w-3.5 h-3.5" />
          {{ snap.errorRatePercent < 5 ? 'Healthy SLA' : 'Anomaly Detected' }}
        </span>
        <span class="text-[10px] text-slate-500 font-mono">4xx/5xx codes</span>
      </div>
    </div>

    <!-- 4. Active Users & Global Reach Card -->
    <div class="relative overflow-hidden rounded-2xl bg-dark-900/80 border border-dark-800 p-4 transition-all hover:border-dark-700 group">
      <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-brand-violet/5 blur-2xl group-hover:bg-brand-violet/10 transition-colors"></div>
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <Users class="w-4 h-4 text-brand-violet" />
          Active Sessions
        </span>
        <div class="flex items-center gap-1 text-[11px] font-mono text-brand-violet">
          <span>LIVE</span>
          <span class="w-1.5 h-1.5 rounded-full bg-brand-violet animate-ping"></span>
        </div>
      </div>

      <div class="flex items-baseline justify-between mt-1">
        <div>
          <span class="text-3xl font-extrabold tracking-tight font-mono text-white">
            {{ snap.activeUsers }}
          </span>
          <span class="ml-1 text-xs text-slate-400 font-mono">users</span>
        </div>
        <div class="text-right">
          <span class="text-xs font-mono text-slate-400">Global Regions</span>
          <div class="text-sm font-semibold font-mono text-slate-200">
            {{ streamEngine.geoBreakdown.value.length || 10 }}
          </div>
        </div>
      </div>

      <div class="mt-3 pt-2.5 border-t border-dark-800 flex items-center justify-between text-[11px] text-slate-400">
        <span class="text-slate-400 truncate">Device distribution: <strong class="text-slate-300 font-mono">Mobile {{ Math.round(((streamEngine.deviceBreakdown.value.mobile || 1) / Math.max(1, streamEngine.recentEvents.value.length)) * 100) }}%</strong></span>
      </div>
    </div>
  </div>
</template>

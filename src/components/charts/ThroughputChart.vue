<script setup lang="ts">
import { computed, ref } from 'vue';
import { Activity, Flame, ShieldAlert } from 'lucide-vue-next';
import { streamEngine } from '../../engine/streamEngine';

const viewMode = ref<'all' | 'rps' | 'latency'>('all');
const hoveredIndex = ref<number | null>(null);

const buckets = computed(() => streamEngine.timeSeriesBuckets.value);

// Chart dimensions
const width = 800;
const height = 240;
const padding = { top: 20, right: 24, bottom: 30, left: 45 };
const plotWidth = width - padding.left - padding.right;
const plotHeight = height - padding.top - padding.bottom;

// Scales
const maxRps = computed(() => {
  const max = Math.max(...buckets.value.map(b => b.count), 15);
  return Math.ceil(max / 5) * 5;
});

const maxLatency = computed(() => {
  const max = Math.max(...buckets.value.map(b => b.p95Latency), 150);
  return Math.ceil(max / 50) * 50;
});

// Area path for RPS
const rpsAreaPath = computed<{ stroke: string; area: string }>(() => {
  const list = buckets.value;
  if (list.length < 2) return { stroke: '', area: '' };
  const points = list.map((b, i) => {
    const x = padding.left + (i / (list.length - 1)) * plotWidth;
    const y = padding.top + plotHeight - (b.count / maxRps.value) * plotHeight;
    return { x, y };
  });

  const first = points[0];
  const last = points[points.length - 1];
  const baseline = padding.top + plotHeight;

  let d = `M ${first.x},${first.y}`;
  for (let i = 1; i < points.length; i++) {
    // Smooth bezier curve
    const prev = points[i - 1];
    const curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx},${prev.y} ${cx},${curr.y} ${curr.x},${curr.y}`;
  }
  const strokePath = d;
  const areaPath = `${d} L ${last.x},${baseline} L ${first.x},${baseline} Z`;

  return { stroke: strokePath, area: areaPath };
});

// Line path for Latency
const latencyLinePath = computed(() => {
  const list = buckets.value;
  if (list.length < 2) return '';
  const points = list.map((b, i) => {
    const x = padding.left + (i / (list.length - 1)) * plotWidth;
    const y = padding.top + plotHeight - (b.p95Latency / maxLatency.value) * plotHeight;
    return { x, y };
  });

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx},${prev.y} ${cx},${curr.y} ${curr.x},${curr.y}`;
  }
  return d;
});

// Y-axis grid ticks
const rpsTicks = computed(() => {
  const step = maxRps.value / 4;
  return [0, step, step * 2, step * 3, maxRps.value].map(val => ({
    val: Math.round(val),
    y: padding.top + plotHeight - (val / maxRps.value) * plotHeight,
  }));
});

// X-axis time labels (every 10 points)
const timeTicks = computed(() => {
  const list = buckets.value;
  const ticks = [];
  for (let i = 0; i < list.length; i += 10) {
    ticks.push({
      label: list[i].label,
      x: padding.left + (i / (list.length - 1)) * plotWidth,
    });
  }
  return ticks;
});

function handleMouseMove(e: MouseEvent) {
  const svg = (e.currentTarget as SVGElement).getBoundingClientRect();
  const relX = e.clientX - svg.left;
  const clampedX = Math.max(padding.left, Math.min(padding.left + plotWidth, relX));
  const ratio = (clampedX - padding.left) / plotWidth;
  const index = Math.round(ratio * (buckets.value.length - 1));
  hoveredIndex.value = Math.max(0, Math.min(buckets.value.length - 1, index));
}

function handleMouseLeave() {
  hoveredIndex.value = null;
}
</script>

<template>
  <div class="rounded-2xl bg-dark-900/80 border border-dark-800 p-4 lg:p-5 relative overflow-hidden">
    <!-- Chart Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
      <div class="flex items-center gap-2">
        <div class="p-1.5 rounded-lg bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
          <Activity class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-semibold text-white tracking-tight">Realtime Telemetry Timeline</h2>
          <p class="text-xs text-slate-400">Rolling 60s window • 1,000ms resolution</p>
        </div>
      </div>

      <!-- Controls & Legend -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-3 text-xs font-mono">
          <div class="flex items-center gap-1.5 text-brand-cyan">
            <span class="w-2.5 h-1 rounded-full bg-brand-cyan"></span>
            <span>RPS</span>
          </div>
          <div class="flex items-center gap-1.5 text-brand-emerald">
            <span class="w-2.5 h-1 rounded-full bg-brand-emerald"></span>
            <span>P95 Latency</span>
          </div>
          <div class="flex items-center gap-1.5 text-brand-rose">
            <span class="w-2 h-2 rounded-full bg-brand-rose"></span>
            <span>Errors</span>
          </div>
        </div>

        <!-- View mode pills -->
        <div class="bg-dark-950/80 p-0.5 rounded-lg border border-dark-800 text-[11px] font-mono hidden sm:flex">
          <button
            v-for="m in [
              { id: 'all', label: 'All' },
              { id: 'rps', label: 'RPS' },
              { id: 'latency', label: 'Latency' },
            ]"
            :key="m.id"
            @click="viewMode = m.id as any"
            :class="[
              'px-2 py-0.5 rounded transition-all',
              viewMode === m.id ? 'bg-dark-800 text-slate-100 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            {{ m.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- SVG Realtime Chart -->
    <div class="relative w-full aspect-[21/9] min-h-[220px]">
      <svg
        class="w-full h-full select-none"
        :viewBox="`0 0 ${width} ${height}`"
        preserveAspectRatio="none"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <defs>
          <!-- Gradient for RPS Area -->
          <linearGradient id="rpsAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.35" />
            <stop offset="80%" stop-color="#06b6d4" stop-opacity="0.02" />
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
          </linearGradient>

          <!-- Glow Filter -->
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Horizontal Grid Lines -->
        <g class="opacity-20 stroke-slate-600" stroke-dasharray="3 3">
          <line
            v-for="tick in rpsTicks"
            :key="tick.y"
            :x1="padding.left"
            :y1="tick.y"
            :x2="width - padding.right"
            :y2="tick.y"
          />
        </g>

        <!-- Y Axis Labels (RPS on left) -->
        <g class="text-[10px] fill-slate-500 font-mono" text-anchor="end">
          <text
            v-for="tick in rpsTicks"
            :key="tick.val"
            :x="padding.left - 8"
            :y="tick.y + 3"
          >
            {{ tick.val }}
          </text>
        </g>

        <!-- X Axis Labels (Time) -->
        <g class="text-[10px] fill-slate-500 font-mono" text-anchor="middle">
          <text
            v-for="tick in timeTicks"
            :key="tick.label"
            :x="tick.x"
            :y="height - 8"
          >
            {{ tick.label }}
          </text>
        </g>

        <!-- Error Spikes (red vertical markers at baseline) -->
        <g v-if="viewMode !== 'latency'">
          <template v-for="(b, i) in buckets" :key="i">
            <line
              v-if="b.errorCount > 0"
              :x1="padding.left + (i / (buckets.length - 1)) * plotWidth"
              :y1="padding.top + plotHeight"
              :x2="padding.left + (i / (buckets.length - 1)) * plotWidth"
              :y2="padding.top + plotHeight - Math.min(plotHeight, b.errorCount * 12)"
              stroke="#f43f5e"
              stroke-width="2.5"
              stroke-linecap="round"
              opacity="0.8"
            />
          </template>
        </g>

        <!-- RPS Area and Line -->
        <g v-if="viewMode !== 'latency'">
          <path :d="rpsAreaPath.area" fill="url(#rpsAreaGradient)" />
          <path
            :d="rpsAreaPath.stroke"
            fill="none"
            stroke="#06b6d4"
            stroke-width="2.2"
            stroke-linecap="round"
            filter="url(#neonGlow)"
          />
        </g>

        <!-- Latency Line -->
        <g v-if="viewMode !== 'rps'">
          <path
            :d="latencyLinePath"
            fill="none"
            stroke="#10b981"
            stroke-width="2"
            stroke-dasharray="4 3"
            stroke-linecap="round"
            opacity="0.85"
          />
        </g>

        <!-- Hover Crosshair -->
        <g v-if="hoveredIndex !== null">
          <!-- Vertical Line -->
          <line
            :x1="padding.left + (hoveredIndex / (buckets.length - 1)) * plotWidth"
            :y1="padding.top"
            :x2="padding.left + (hoveredIndex / (buckets.length - 1)) * plotWidth"
            :y2="padding.top + plotHeight"
            stroke="#94a3b8"
            stroke-width="1.5"
            stroke-dasharray="2 2"
            opacity="0.6"
          />
          <!-- Point Marker on RPS -->
          <circle
            :cx="padding.left + (hoveredIndex / (buckets.length - 1)) * plotWidth"
            :cy="padding.top + plotHeight - (buckets[hoveredIndex].count / maxRps) * plotHeight"
            r="4.5"
            fill="#06b6d4"
            stroke="#0b0f19"
            stroke-width="2"
          />
          <!-- Point Marker on Latency -->
          <circle
            :cx="padding.left + (hoveredIndex / (buckets.length - 1)) * plotWidth"
            :cy="padding.top + plotHeight - (buckets[hoveredIndex].p95Latency / maxLatency) * plotHeight"
            r="4.5"
            fill="#10b981"
            stroke="#0b0f19"
            stroke-width="2"
          />
        </g>
      </svg>

      <!-- Tooltip Box -->
      <div
        v-if="hoveredIndex !== null"
        class="absolute pointer-events-none z-20 bg-dark-900/95 border border-dark-700 rounded-xl p-2.5 shadow-2xl text-xs backdrop-blur-md transition-all"
        :style="{
          left: `${Math.min(75, Math.max(10, ((hoveredIndex / (buckets.length - 1)) * 100)))}%`,
          top: '10px',
        }"
      >
        <div class="font-mono text-[11px] text-slate-400 mb-1 border-b border-dark-800 pb-1 flex items-center justify-between gap-3">
          <span>Time: {{ buckets[hoveredIndex].label }}</span>
          <span v-if="buckets[hoveredIndex].errorCount > 0" class="text-rose-400 flex items-center gap-1 font-bold">
            <ShieldAlert class="w-3 h-3" /> {{ buckets[hoveredIndex].errorCount }} errors
          </span>
        </div>
        <div class="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
          <span class="text-slate-400">Throughput:</span>
          <span class="text-cyan-400 font-bold text-right">{{ buckets[hoveredIndex].count }} eps</span>
          <span class="text-slate-400">P95 Latency:</span>
          <span class="text-emerald-400 font-bold text-right">{{ buckets[hoveredIndex].p95Latency }} ms</span>
          <span class="text-slate-400">Avg Latency:</span>
          <span class="text-slate-200 text-right">{{ buckets[hoveredIndex].avgLatency }} ms</span>
        </div>
      </div>
    </div>
  </div>
</template>

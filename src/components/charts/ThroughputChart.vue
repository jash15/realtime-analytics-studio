<script setup lang="ts">
import { computed, ref } from 'vue';
import { Activity, Flame, ShieldAlert } from 'lucide-vue-next';
import { streamEngine } from '../../engine/streamEngine';

const viewMode = ref<'all' | 'rps' | 'latency'>('all');
const hoveredIndex = ref<number | null>(null);

const buckets = computed(() => streamEngine.timeSeriesBuckets.value);

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
    const x = (i / (list.length - 1)) * 1000;
    const y = 200 - (b.count / maxRps.value) * 190;
    return { x, y };
  });

  const first = points[0];
  const last = points[points.length - 1];

  let d = `M ${first.x},${first.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx},${prev.y} ${cx},${curr.y} ${curr.x},${curr.y}`;
  }
  const strokePath = d;
  const areaPath = `${d} L ${last.x},200 L ${first.x},200 Z`;

  return { stroke: strokePath, area: areaPath };
});

// Line path for Latency
const latencyLinePath = computed(() => {
  const list = buckets.value;
  if (list.length < 2) return '';
  const points = list.map((b, i) => {
    const x = (i / (list.length - 1)) * 1000;
    const y = 200 - (b.p95Latency / maxLatency.value) * 190;
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
  return [maxRps.value, step * 3, step * 2, step, 0].map(val => Math.round(val));
});

// X-axis time labels (sample 6 points)
const timeTicks = computed(() => {
  const list = buckets.value;
  const ticks = [];
  const step = Math.floor((list.length - 1) / 5);
  for (let i = 0; i < list.length; i += step) {
    if (ticks.length < 6) {
      ticks.push(list[i].label);
    }
  }
  return ticks;
});

function handleMouseMove(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const relX = e.clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, relX / rect.width));
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
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
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

    <!-- Chart Grid Container -->
    <div class="relative flex gap-2">
      <!-- Left Y-Axis HTML Labels (Never squished or distorted) -->
      <div class="w-10 flex flex-col justify-between text-right text-[10px] font-mono text-slate-500 py-1 select-none flex-shrink-0">
        <span v-for="tick in rpsTicks" :key="tick">{{ tick }}</span>
      </div>

      <!-- Main Chart Canvas Area -->
      <div
        class="relative flex-1 h-52 cursor-crosshair select-none bg-dark-950/40 rounded-xl border border-dark-800/80 overflow-hidden"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <!-- Horizontal Grid Lines -->
        <div class="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 px-1 py-1">
          <div v-for="n in 5" :key="n" class="w-full border-b border-dashed border-slate-500"></div>
        </div>

        <!-- SVG Visual Paths -->
        <svg
          class="w-full h-full overflow-visible"
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="rpsAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.38" />
              <stop offset="85%" stop-color="#06b6d4" stop-opacity="0.04" />
              <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
            </linearGradient>
          </defs>

          <!-- Error Spike Markers -->
          <g v-if="viewMode !== 'latency'">
            <template v-for="(b, i) in buckets" :key="i">
              <line
                v-if="b.errorCount > 0"
                :x1="(i / (buckets.length - 1)) * 1000"
                y1="200"
                :x2="(i / (buckets.length - 1)) * 1000"
                :y2="200 - Math.min(180, b.errorCount * 25)"
                stroke="#f43f5e"
                stroke-width="3"
                vector-effect="non-scaling-stroke"
                opacity="0.8"
              />
            </template>
          </g>

          <!-- RPS Area Curve -->
          <g v-if="viewMode !== 'latency'">
            <path :d="rpsAreaPath.area" fill="url(#rpsAreaGradient)" />
            <path
              :d="rpsAreaPath.stroke"
              fill="none"
              stroke="#06b6d4"
              stroke-width="2.5"
              vector-effect="non-scaling-stroke"
            />
          </g>

          <!-- Latency Line Curve -->
          <g v-if="viewMode !== 'rps'">
            <path
              :d="latencyLinePath"
              fill="none"
              stroke="#10b981"
              stroke-width="2"
              stroke-dasharray="5 3"
              vector-effect="non-scaling-stroke"
              opacity="0.85"
            />
          </g>
        </svg>

        <!-- Hover Guideline & Point Markers -->
        <div
          v-if="hoveredIndex !== null"
          class="absolute top-0 bottom-0 pointer-events-none"
          :style="{ left: `${(hoveredIndex / (buckets.length - 1)) * 100}%` }"
        >
          <div class="w-px h-full bg-slate-400/60 border-l border-dashed border-slate-300"></div>

          <!-- Marker on RPS line -->
          <div
            v-if="viewMode !== 'latency'"
            class="absolute w-3 h-3 -ml-1.5 rounded-full bg-brand-cyan border-2 border-dark-950 shadow-md"
            :style="{
              top: `${Math.max(4, Math.min(96, 100 - (buckets[hoveredIndex].count / maxRps) * 95))}%`
            }"
          ></div>

          <!-- Marker on Latency line -->
          <div
            v-if="viewMode !== 'rps'"
            class="absolute w-3 h-3 -ml-1.5 rounded-full bg-brand-emerald border-2 border-dark-950 shadow-md"
            :style="{
              top: `${Math.max(4, Math.min(96, 100 - (buckets[hoveredIndex].p95Latency / maxLatency) * 95))}%`
            }"
          ></div>
        </div>

        <!-- Tooltip Box (HTML Overlay) -->
        <div
          v-if="hoveredIndex !== null"
          class="absolute pointer-events-none z-30 bg-dark-900/95 border border-dark-700 rounded-xl p-2.5 shadow-2xl text-xs backdrop-blur-md transition-all font-mono"
          :style="{
            left: `${Math.min(72, Math.max(6, ((hoveredIndex / (buckets.length - 1)) * 100)))}%`,
            top: '8px',
          }"
        >
          <div class="text-[11px] text-slate-400 mb-1 border-b border-dark-800 pb-1 flex items-center justify-between gap-3">
            <span>Time: {{ buckets[hoveredIndex].label }}</span>
            <span v-if="buckets[hoveredIndex].errorCount > 0" class="text-rose-400 flex items-center gap-1 font-bold">
              <ShieldAlert class="w-3 h-3" /> {{ buckets[hoveredIndex].errorCount }} errors
            </span>
          </div>
          <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
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

    <!-- Bottom X-Axis HTML Time Labels -->
    <div class="flex justify-between pl-12 pr-2 mt-2 text-[10px] font-mono text-slate-500 select-none">
      <span v-for="t in timeTicks" :key="t">{{ t }}</span>
    </div>
  </div>
</template>

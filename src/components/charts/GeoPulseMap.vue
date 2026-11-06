<script setup lang="ts">
import { computed } from 'vue';
import { Globe, Radio, Wifi } from 'lucide-vue-next';
import { streamEngine } from '../../engine/streamEngine';
import { GEO_LOCATIONS } from '../../engine/dataPresets';
import { formatNumber } from '../../utils/formatters';

const mapWidth = 600;
const mapHeight = 300;

function projectCoords(lat: number, lng: number) {
  // Equirectangular mapping with clean padding
  const x = ((lng + 180) / 360) * (mapWidth - 40) + 20;
  const y = ((90 - lat) / 180) * (mapHeight - 40) + 20;
  return { x: Math.round(x), y: Math.round(y) };
}

const geoList = computed(() => streamEngine.geoBreakdown.value);

const maxEvents = computed(() => {
  return Math.max(...geoList.value.map(g => g.eventCount), 1);
});

// Edge node points
const edgeNodes = computed(() => {
  return GEO_LOCATIONS.map(loc => {
    const coords = projectCoords(loc.lat, loc.lng);
    const data = geoList.value.find(g => g.code === loc.countryCode);
    const count = data ? data.eventCount : 0;
    const avgLatency = data ? data.avgLatency : 45;
    const errorCount = data ? data.errorCount : 0;
    return {
      ...loc,
      x: coords.x,
      y: coords.y,
      count,
      avgLatency,
      errorCount,
      hasRecent: count > 0,
    };
  });
});
</script>

<template>
  <div class="rounded-2xl bg-dark-900/80 border border-dark-800 p-4 lg:p-5 flex flex-col justify-between">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="p-1.5 rounded-lg bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
          <Globe class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-semibold text-white tracking-tight">Global Edge Traffic & Ingress</h2>
          <p class="text-xs text-slate-400">10 Multi-Region Edge Points of Presence</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
        <Radio class="w-3.5 h-3.5 animate-pulse" />
        <span>10 EDGES NOMINAL</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
      <!-- High-Tech SVG Edge Map Grid -->
      <div class="lg:col-span-7 relative bg-dark-950/70 rounded-xl border border-dark-800/80 p-3 overflow-hidden aspect-[2/1] flex items-center justify-center">
        <svg
          class="w-full h-full select-none"
          :viewBox="`0 0 ${mapWidth} ${mapHeight}`"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <!-- Node Glow -->
            <radialGradient id="edgeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
            </radialGradient>
            <!-- Pattern for cyber grid dots -->
            <pattern id="dotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#334155" opacity="0.3" />
            </pattern>
          </defs>

          <!-- Dot Matrix Background Fill -->
          <rect width="100%" height="100%" fill="url(#dotGrid)" />

          <!-- Coordinate Latitude & Longitude Guidelines -->
          <g stroke="#1e293b" stroke-width="0.75" stroke-dasharray="2 3" opacity="0.8">
            <line x1="0" y1="75" :x2="mapWidth" y2="75" />
            <line x1="0" y1="150" :x2="mapWidth" y2="150" />
            <line x1="0" y1="225" :x2="mapWidth" y2="225" />
            <line x1="150" y1="0" x2="150" :y2="mapHeight" />
            <line x1="300" y1="0" x2="300" :y2="mapHeight" />
            <line x1="450" y1="0" x2="450" :y2="mapHeight" />
          </g>

          <!-- Inter-Edge Network Topology Arcs -->
          <g stroke="#06b6d4" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.35" fill="none">
            <!-- Transatlantic: SF -> NY -> London -> Frankfurt -->
            <path d="M 115 106 Q 160 80 193 102" />
            <path d="M 193 102 Q 255 50 316 84" />
            <path d="M 316 84 L 330 87" />
            <!-- Eurasia: Frankfurt -> Mumbai -> Singapore -> Tokyo -->
            <path d="M 330 87 Q 380 110 437 138" />
            <path d="M 437 138 Q 465 150 488 168" />
            <path d="M 488 168 Q 520 120 548 109" />
            <!-- Transpacific: Tokyo -> Sydney -->
            <path d="M 548 109 Q 555 170 567 225" />
            <!-- Americas: NY -> São Paulo -->
            <path d="M 193 102 Q 220 160 238 208" />
          </g>

          <!-- Edge Node Beacons -->
          <g v-for="node in edgeNodes" :key="node.city">
            <!-- Ripple Wave -->
            <circle
              v-if="node.hasRecent"
              :cx="node.x"
              :y="node.y"
              r="12"
              fill="url(#edgeGlow)"
              class="animate-ping opacity-60"
            />
            <!-- Outer Core Ring -->
            <circle
              :cx="node.x"
              :y="node.y"
              :r="node.hasRecent ? 5 : 3.5"
              :fill="node.errorCount > 0 ? '#f43f5e' : '#10b981'"
              stroke="#06080e"
              stroke-width="1.5"
            />
            <!-- Edge City Label -->
            <text
              :x="node.x"
              :y="node.y - 7"
              font-size="8"
              font-family="monospace"
              fill="#cbd5e1"
              font-weight="600"
              text-anchor="middle"
              opacity="0.9"
            >
              {{ node.city }}
            </text>
          </g>
        </svg>

        <!-- Bottom Left Telemetry Status -->
        <div class="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400 bg-dark-900/90 px-2 py-0.5 rounded border border-dark-800 flex items-center gap-1.5">
          <Wifi class="w-3 h-3 text-brand-emerald" />
          <span>ANYCAST ROUTING ACTIVE</span>
        </div>
      </div>

      <!-- Regional Breakdown List -->
      <div class="lg:col-span-5 space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
        <div
          v-for="item in geoList.slice(0, 6)"
          :key="item.code"
          class="bg-dark-950/60 p-2.5 rounded-xl border border-dark-800/80 hover:border-dark-700 transition-colors"
        >
          <div class="flex items-center justify-between text-xs mb-1.5 font-mono">
            <div class="flex items-center gap-2">
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700 font-bold">
                {{ item.code }}
              </span>
              <span class="font-medium text-slate-200 font-sans truncate">{{ item.name }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="text-slate-400">{{ formatNumber(item.eventCount) }}</span>
              <span
                class="text-[11px] font-bold"
                :class="item.avgLatency > 150 ? 'text-amber-400' : 'text-emerald-400'"
              >
                {{ item.avgLatency }}ms
              </span>
            </div>
          </div>

          <!-- Volume Progress Bar -->
          <div class="w-full bg-dark-900 h-1.5 rounded-full overflow-hidden flex">
            <div
              class="bg-gradient-to-r from-brand-cyan to-brand-emerald h-full rounded-full transition-all duration-300"
              :style="{ width: `${Math.max(4, Math.round((item.eventCount / maxEvents) * 100))}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

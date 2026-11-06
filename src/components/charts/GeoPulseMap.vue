<script setup lang="ts">
import { computed } from 'vue';
import { Globe, Radio } from 'lucide-vue-next';
import { streamEngine } from '../../engine/streamEngine';
import { GEO_LOCATIONS } from '../../engine/dataPresets';
import { formatNumber } from '../../utils/formatters';

const mapWidth = 600;
const mapHeight = 320;

function projectCoords(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * mapWidth;
  // Standard equirectangular projection with latitude clamp
  const y = ((90 - lat) / 180) * mapHeight;
  return { x: Math.round(x), y: Math.round(y) };
}

const geoList = computed(() => streamEngine.geoBreakdown.value);

const maxEvents = computed(() => {
  return Math.max(...geoList.value.map(g => g.eventCount), 1);
});

// Markers with calculated coordinates
const markers = computed(() => {
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
  <div class="rounded-2xl bg-dark-900/80 border border-dark-800 p-4 lg:p-5">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="p-1.5 rounded-lg bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
          <Globe class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-semibold text-white tracking-tight">Global Traffic & Latency Distribution</h2>
          <p class="text-xs text-slate-400">Live multi-region ingress telemetry</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
        <Radio class="w-3.5 h-3.5 animate-pulse" />
        <span>10 ACTIVE EDGES</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
      <!-- SVG World Map Graphic -->
      <div class="lg:col-span-7 relative bg-dark-950/60 rounded-xl border border-dark-800/80 p-2 overflow-hidden aspect-[16/9] flex items-center justify-center">
        <!-- World map grid & simplified continent dots SVG -->
        <svg
          class="w-full h-full select-none"
          :viewBox="`0 0 ${mapWidth} ${mapHeight}`"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <!-- Radial Pulse for Nodes -->
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.8" />
              <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
            </radialGradient>
          </defs>

          <!-- Latitude & Longitude Coordinate Lines -->
          <g stroke="#1e293b" stroke-width="0.75" stroke-dasharray="2 4" opacity="0.6">
            <!-- Latitudes -->
            <line x1="0" y1="80" :x2="mapWidth" y2="80" />
            <line x1="0" y1="160" :x2="mapWidth" y2="160" />
            <line x1="0" y1="240" :x2="mapWidth" y2="240" />
            <!-- Longitudes -->
            <line x1="150" y1="0" x2="150" :y2="mapHeight" />
            <line x1="300" y1="0" x2="300" :y2="mapHeight" />
            <line x1="450" y1="0" x2="450" :y2="mapHeight" />
          </g>

          <!-- Stylized Continent Silhouette Outlines (lightweight geometric vectors) -->
          <g fill="#172033" opacity="0.45">
            <!-- North America -->
            <path d="M 60 70 L 150 65 L 180 110 L 130 145 L 100 135 L 75 95 Z" />
            <!-- South America -->
            <path d="M 130 170 L 175 180 L 160 250 L 140 260 L 125 210 Z" />
            <!-- Europe -->
            <path d="M 270 75 L 340 70 L 330 115 L 290 120 L 265 95 Z" />
            <!-- Africa -->
            <path d="M 270 130 L 340 135 L 330 220 L 290 230 L 275 170 Z" />
            <!-- Asia -->
            <path d="M 345 65 L 480 75 L 470 140 L 410 150 L 360 130 Z" />
            <!-- Australia -->
            <path d="M 450 205 L 520 210 L 510 260 L 460 255 Z" />
          </g>

          <!-- Regional Connection Arcs -->
          <g stroke="#06b6d4" stroke-width="1" stroke-dasharray="2 3" opacity="0.25">
            <path d="M 96 93 Q 190 40 286 71" fill="none" />
            <path d="M 286 71 Q 400 30 532 97" fill="none" />
            <path d="M 532 97 Q 540 180 552 220" fill="none" />
          </g>

          <!-- Active Region Hotspot Markers -->
          <g v-for="m in markers" :key="m.city">
            <!-- Pulsing outer circle if has events -->
            <circle
              v-if="m.hasRecent"
              :cx="m.x"
              :y="m.y"
              r="14"
              fill="url(#nodeGlow)"
              class="animate-ping opacity-50"
              style="transform-origin: center;"
            />
            <!-- Base Ring -->
            <circle
              :cx="m.x"
              :y="m.y"
              :r="m.hasRecent ? 5 : 3"
              :fill="m.errorCount > 0 ? '#f43f5e' : '#10b981'"
              stroke="#06080e"
              stroke-width="1.5"
            />
            <!-- City label -->
            <text
              :x="m.x"
              :y="m.y - 8"
              font-size="9"
              font-family="monospace"
              fill="#94a3b8"
              text-anchor="middle"
              opacity="0.8"
            >
              {{ m.city }}
            </text>
          </g>
        </svg>

        <!-- Bottom Overlay Coordinates Info -->
        <div class="absolute bottom-2 left-2 text-[10px] font-mono text-slate-500 bg-dark-900/80 px-2 py-0.5 rounded border border-dark-800">
          EDGE NODES: 10 GLOBAL POPs
        </div>
      </div>

      <!-- Regional Breakdown Ranking List -->
      <div class="lg:col-span-5 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        <div
          v-for="item in geoList.slice(0, 6)"
          :key="item.code"
          class="bg-dark-950/60 p-2.5 rounded-xl border border-dark-800/80 hover:border-dark-700 transition-colors"
        >
          <div class="flex items-center justify-between text-xs mb-1.5">
            <div class="flex items-center gap-2">
              <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">
                {{ item.code }}
              </span>
              <span class="font-medium text-slate-200 truncate">{{ item.name }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs font-mono">
              <span class="text-slate-400">{{ formatNumber(item.eventCount) }}</span>
              <span
                class="text-[11px]"
                :class="item.avgLatency > 150 ? 'text-amber-400' : 'text-emerald-400'"
              >
                {{ item.avgLatency }}ms
              </span>
            </div>
          </div>

          <!-- Relative Volume Bar -->
          <div class="w-full bg-dark-800 h-1.5 rounded-full overflow-hidden flex">
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


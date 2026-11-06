<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Search,
  Filter,
  Play,
  Pause,
  ExternalLink,
  Zap,
  Clock,
  Globe,
  Radio,
} from 'lucide-vue-next';
import { streamEngine } from '../../engine/streamEngine';
import type { TelemetryEvent, EventType } from '../../types/analytics';
import { formatTime, formatLatency, getStatusCodeColor } from '../../utils/formatters';
import EventDetailModal from './EventDetailModal.vue';

const searchQuery = ref('');
const selectedType = ref<EventType | 'all'>('all');
const selectedStatus = ref<'all' | '2xx' | '3xx' | '4xx' | '5xx'>('all');
const autoScroll = ref(true);
const selectedEvent = ref<TelemetryEvent | null>(null);

const events = computed(() => {
  let list = streamEngine.recentEvents.value;

  if (selectedType.value !== 'all') {
    list = list.filter(e => e.type === selectedType.value);
  }

  if (selectedStatus.value !== 'all') {
    if (selectedStatus.value === '2xx') list = list.filter(e => e.statusCode >= 200 && e.statusCode < 300);
    else if (selectedStatus.value === '3xx') list = list.filter(e => e.statusCode >= 300 && e.statusCode < 400);
    else if (selectedStatus.value === '4xx') list = list.filter(e => e.statusCode >= 400 && e.statusCode < 500);
    else if (selectedStatus.value === '5xx') list = list.filter(e => e.statusCode >= 500);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(e =>
      e.endpoint.toLowerCase().includes(q) ||
      e.userId.toLowerCase().includes(q) ||
      e.city.toLowerCase().includes(q) ||
      e.country.toLowerCase().includes(q) ||
      String(e.statusCode).includes(q)
    );
  }

  return list;
});

function openDetail(evt: TelemetryEvent) {
  selectedEvent.value = evt;
}
</script>

<template>
  <div class="rounded-2xl bg-dark-900/80 border border-dark-800 p-4 lg:p-5 flex flex-col min-h-[500px] h-[calc(100vh-280px)] max-h-[700px]">
    <!-- Top Filter & Search Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-dark-800">
      <div class="flex items-center gap-2">
        <div class="p-1.5 rounded-lg bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
          <Radio class="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <h2 class="text-sm font-semibold text-white tracking-tight">Live Ingestion Event Feed</h2>
          <p class="text-xs text-slate-400">Inspecting rolling ring buffer (max 500)</p>
        </div>
      </div>

      <!-- Search Input -->
      <div class="flex flex-wrap items-center gap-2 flex-1 max-w-md">
        <div class="relative w-full">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filter by endpoint, user, city, status..."
            class="w-full bg-dark-950/80 border border-dark-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-cyan transition-colors font-mono"
          />
        </div>
      </div>

      <!-- Quick Filter Pills -->
      <div class="flex items-center gap-2">
        <!-- Type Filter -->
        <select
          v-model="selectedType"
          class="bg-dark-950/80 border border-dark-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-cyan font-mono"
        >
          <option value="all">All Types</option>
          <option value="pageview">Pageview</option>
          <option value="api_call">API Call</option>
          <option value="checkout">Checkout</option>
          <option value="auth">Auth</option>
          <option value="error">Error</option>
          <option value="custom">Custom</option>
        </select>

        <!-- Status Filter -->
        <select
          v-model="selectedStatus"
          class="bg-dark-950/80 border border-dark-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-cyan font-mono"
        >
          <option value="all">All Statuses</option>
          <option value="2xx">2xx Success</option>
          <option value="3xx">3xx Redirect</option>
          <option value="4xx">4xx Client Err</option>
          <option value="5xx">5xx Server Err</option>
        </select>

        <!-- Stream Pause Toggle -->
        <button
          @click="streamEngine.toggleRunning"
          :class="[
            'p-1.5 rounded-xl border text-xs transition-colors',
            streamEngine.isRunning.value
              ? 'bg-dark-850 hover:bg-dark-800 border-dark-700 text-slate-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          ]"
          :title="streamEngine.isRunning.value ? 'Freeze Stream' : 'Resume Stream'"
        >
          <component :is="streamEngine.isRunning.value ? Pause : Play" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Event Stream Table -->
    <div class="flex-1 overflow-y-auto rounded-xl border border-dark-800 bg-dark-950/60 font-mono text-xs">
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 bg-dark-900 border-b border-dark-800 text-[11px] text-slate-400 z-10">
          <tr>
            <th class="py-2.5 px-3">TIMESTAMP</th>
            <th class="py-2.5 px-3">METHOD & ENDPOINT</th>
            <th class="py-2.5 px-3 text-center">STATUS</th>
            <th class="py-2.5 px-3">LATENCY</th>
            <th class="py-2.5 px-3">LOCATION</th>
            <th class="py-2.5 px-3">USER / DEVICE</th>
            <th class="py-2.5 px-3 text-right">ACTION</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dark-850/60">
          <tr
            v-for="evt in events"
            :key="evt.id"
            @click="openDetail(evt)"
            class="hover:bg-dark-850/50 cursor-pointer transition-colors group"
          >
            <!-- Timestamp -->
            <td class="py-2 px-3 text-slate-500 whitespace-nowrap">
              {{ formatTime(evt.timestamp) }}
            </td>

            <!-- Method & Endpoint -->
            <td class="py-2 px-3">
              <div class="flex items-center gap-2">
                <span
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  :class="[
                    evt.method === 'GET' ? 'bg-blue-500/10 text-blue-400' :
                    evt.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400' :
                    evt.method === 'DELETE' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-amber-500/10 text-amber-400'
                  ]"
                >
                  {{ evt.method }}
                </span>
                <span class="text-slate-200 group-hover:text-brand-cyan transition-colors truncate max-w-xs">
                  {{ evt.endpoint }}
                </span>
              </div>
            </td>

            <!-- Status Code Badge -->
            <td class="py-2 px-3 text-center whitespace-nowrap">
              <span
                class="px-2 py-0.5 rounded text-[11px] font-bold border"
                :class="[getStatusCodeColor(evt.statusCode).text, getStatusCodeColor(evt.statusCode).bg, getStatusCodeColor(evt.statusCode).border]"
              >
                {{ evt.statusCode }}
              </span>
            </td>

            <!-- Latency -->
            <td class="py-2 px-3 whitespace-nowrap">
              <div class="flex items-center gap-1.5">
                <span
                  class="text-[11px] font-medium"
                  :class="[
                    evt.latencyMs > 400 ? 'text-rose-400 font-bold' :
                    evt.latencyMs > 200 ? 'text-amber-400' :
                    'text-emerald-400'
                  ]"
                >
                  {{ formatLatency(evt.latencyMs) }}
                </span>
                <!-- Mini Bar Gauge -->
                <div class="w-10 bg-dark-900 h-1.5 rounded-full overflow-hidden hidden sm:block">
                  <div
                    class="h-full rounded-full"
                    :class="evt.latencyMs > 400 ? 'bg-rose-500' : evt.latencyMs > 200 ? 'bg-amber-500' : 'bg-emerald-500'"
                    :style="{ width: `${Math.min(100, (evt.latencyMs / 600) * 100)}%` }"
                  ></div>
                </div>
              </div>
            </td>

            <!-- Location -->
            <td class="py-2 px-3 whitespace-nowrap text-slate-300">
              <span class="flex items-center gap-1">
                <span class="text-slate-500 font-bold text-[10px]">{{ evt.countryCode }}</span>
                <span class="text-slate-400">{{ evt.city }}</span>
              </span>
            </td>

            <!-- User & Device -->
            <td class="py-2 px-3 whitespace-nowrap text-slate-400 text-[11px]">
              <span class="text-slate-300">{{ evt.userId }}</span>
              <span class="text-slate-500"> • {{ evt.device }}</span>
            </td>

            <!-- Inspect action -->
            <td class="py-2 px-3 text-right whitespace-nowrap">
              <button
                @click.stop="openDetail(evt)"
                class="opacity-0 group-hover:opacity-100 p-1 rounded bg-dark-800 text-slate-300 hover:text-white transition-opacity"
                title="Inspect Payload"
              >
                <ExternalLink class="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>

          <tr v-if="events.length === 0">
            <td colspan="7" class="py-12 text-center text-slate-500 italic">
              No telemetry events match your active filters.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Bottom Stream Footer Stats -->
    <div class="mt-3 pt-2 border-t border-dark-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
      <div class="flex items-center gap-3">
        <span>Displaying: <strong class="text-slate-300">{{ events.length }}</strong> events</span>
        <span>Total Buffer: <strong class="text-slate-300">{{ streamEngine.recentEvents.value.length }} / 500</strong></span>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
        <span>Streaming Buffer Active</span>
      </div>
    </div>

    <!-- Event Detail Modal -->
    <EventDetailModal :event="selectedEvent" @close="selectedEvent = null" />
  </div>
</template>


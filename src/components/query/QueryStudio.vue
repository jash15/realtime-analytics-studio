<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Search,
  Sparkles,
  BarChart2,
  Table as TableIcon,
  RotateCcw,
  Clock,
  AlertCircle,
} from 'lucide-vue-next';
import { streamEngine } from '../../engine/streamEngine';
import { QueryEngine, type GroupByField, type QueryFilter } from '../../engine/queryEngine';
import type { EventType } from '../../types/analytics';
import { formatLatency } from '../../utils/formatters';

const groupBy = ref<GroupByField>('endpoint');
const filterType = ref<EventType | 'all'>('all');
const filterStatus = ref<'all' | '2xx' | '3xx' | '4xx' | '5xx' | 'errors'>('all');
const endpointFilter = ref('');
const minLatency = ref<number>(0);

const currentFilter = computed<QueryFilter>(() => ({
  type: filterType.value,
  statusCodeFilter: filterStatus.value,
  endpointQuery: endpointFilter.value,
  minLatency: minLatency.value > 0 ? minLatency.value : undefined,
}));

const queryResult = computed(() => {
  return QueryEngine.execute(
    streamEngine.recentEvents.value,
    currentFilter.value,
    groupBy.value
  );
});

// Quick preset queries
function applyPreset(preset: 'slowest' | 'errors' | 'geo' | 'devices') {
  if (preset === 'slowest') {
    groupBy.value = 'endpoint';
    filterType.value = 'all';
    filterStatus.value = 'all';
    endpointFilter.value = '';
    minLatency.value = 100;
  } else if (preset === 'errors') {
    groupBy.value = 'country';
    filterType.value = 'all';
    filterStatus.value = 'errors';
    endpointFilter.value = '';
    minLatency.value = 0;
  } else if (preset === 'geo') {
    groupBy.value = 'country';
    filterType.value = 'all';
    filterStatus.value = 'all';
    endpointFilter.value = '';
    minLatency.value = 0;
  } else if (preset === 'devices') {
    groupBy.value = 'device';
    filterType.value = 'all';
    filterStatus.value = 'all';
    endpointFilter.value = '';
    minLatency.value = 0;
  }
}

function resetQuery() {
  groupBy.value = 'endpoint';
  filterType.value = 'all';
  filterStatus.value = 'all';
  endpointFilter.value = '';
  minLatency.value = 0;
}
</script>

<template>
  <div class="rounded-2xl bg-dark-900/80 border border-dark-800 p-4 lg:p-5 flex flex-col gap-5">
    <!-- Header & Presets -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-dark-800">
      <div class="flex items-center gap-2">
        <div class="p-1.5 rounded-lg bg-brand-violet/15 text-brand-violet border border-brand-violet/30">
          <Sparkles class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-semibold text-white tracking-tight">Query & Aggregation Studio</h2>
          <p class="text-xs text-slate-400">Interactive group-by telemetry explorer with instant reactive computation</p>
        </div>
      </div>

      <!-- Quick Preset Buttons -->
      <div class="flex flex-wrap items-center gap-1.5 text-xs font-mono">
        <span class="text-slate-500 text-[11px] mr-1">Presets:</span>
        <button
          @click="applyPreset('slowest')"
          class="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-slate-300 hover:text-brand-cyan transition-colors"
        >
          🐢 Slowest Endpoints
        </button>
        <button
          @click="applyPreset('errors')"
          class="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-slate-300 hover:text-brand-rose transition-colors"
        >
          💥 Errors by Country
        </button>
        <button
          @click="applyPreset('geo')"
          class="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-slate-300 hover:text-brand-emerald transition-colors"
        >
          🌍 Geo Traffic
        </button>
        <button
          @click="applyPreset('devices')"
          class="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-slate-300 hover:text-brand-violet transition-colors"
        >
          📱 Device Share
        </button>
        <button
          @click="resetQuery"
          class="p-1 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-slate-400 hover:text-slate-200 transition-colors"
          title="Reset filters"
        >
          <RotateCcw class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Query Builder Form -->
    <div class="bg-dark-950/70 p-4 rounded-xl border border-dark-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
      <!-- 1. Group By -->
      <div>
        <label class="block text-slate-400 mb-1 font-sans text-[11px] font-medium">GROUP BY DIMENSION</label>
        <select
          v-model="groupBy"
          class="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-violet"
        >
          <option value="endpoint">API Endpoint</option>
          <option value="country">Country / Region</option>
          <option value="statusCode">Status Code</option>
          <option value="browser">Browser Agent</option>
          <option value="device">Device Type</option>
        </select>
      </div>

      <!-- 2. Event Type -->
      <div>
        <label class="block text-slate-400 mb-1 font-sans text-[11px] font-medium">FILTER EVENT TYPE</label>
        <select
          v-model="filterType"
          class="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-violet"
        >
          <option value="all">All Types (*)</option>
          <option value="pageview">pageview</option>
          <option value="api_call">api_call</option>
          <option value="checkout">checkout</option>
          <option value="auth">auth</option>
          <option value="error">error</option>
          <option value="custom">custom</option>
        </select>
      </div>

      <!-- 3. Status Filter -->
      <div>
        <label class="block text-slate-400 mb-1 font-sans text-[11px] font-medium">STATUS CODE</label>
        <select
          v-model="filterStatus"
          class="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-violet"
        >
          <option value="all">All Statuses</option>
          <option value="2xx">2xx OK</option>
          <option value="3xx">3xx Redirect</option>
          <option value="4xx">4xx Client Error</option>
          <option value="5xx">5xx Server Error</option>
          <option value="errors">Any Error (&gt;=400)</option>
        </select>
      </div>

      <!-- 4. Min Latency & Endpoint Search -->
      <div>
        <label class="block text-slate-400 mb-1 font-sans text-[11px] font-medium">MIN LATENCY / PATH MATCH</label>
        <div class="flex items-center gap-1.5">
          <input
            v-model="endpointFilter"
            type="text"
            placeholder="Search path..."
            class="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-violet"
          />
          <input
            v-model.number="minLatency"
            type="number"
            min="0"
            step="50"
            placeholder="ms"
            title="Minimum latency in ms"
            class="w-16 bg-dark-900 border border-dark-700 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-brand-violet text-center"
          />
        </div>
      </div>
    </div>

    <!-- Query SQL Preview Bar -->
    <div class="bg-dark-950 p-2.5 rounded-xl border border-dark-800/80 font-mono text-[11px] text-slate-400 flex items-center justify-between overflow-x-auto">
      <div class="flex items-center gap-2">
        <span class="text-brand-violet font-semibold">SQL QUERY:</span>
        <code class="text-slate-300">
          SELECT {{ groupBy }}, count(*), avg(latencyMs), max(latencyMs), count(err)
          FROM stream_window
          WHERE 1=1
          <template v-if="filterType !== 'all'"> AND type = '{{ filterType }}'</template>
          <template v-if="filterStatus !== 'all'"> AND status = '{{ filterStatus }}'</template>
          <template v-if="minLatency > 0"> AND latencyMs &gt;= {{ minLatency }}</template>
          GROUP BY {{ groupBy }} ORDER BY count(*) DESC
        </code>
      </div>
      <div class="text-slate-500 whitespace-nowrap pl-2">
        Matches: <strong class="text-emerald-400">{{ queryResult.totalFiltered }}</strong>
      </div>
    </div>

    <!-- Results Table & Visualization -->
    <div class="rounded-xl border border-dark-800 bg-dark-950/60 overflow-hidden font-mono text-xs">
      <table class="w-full text-left border-collapse">
        <thead class="bg-dark-900 border-b border-dark-800 text-[11px] text-slate-400">
          <tr>
            <th class="py-2.5 px-3">DIMENSION KEY ({{ groupBy.toUpperCase() }})</th>
            <th class="py-2.5 px-3 text-right">EVENT COUNT</th>
            <th class="py-2.5 px-3">SHARE %</th>
            <th class="py-2.5 px-3 text-right">AVG LATENCY</th>
            <th class="py-2.5 px-3 text-right">MAX LATENCY</th>
            <th class="py-2.5 px-3 text-right">ERROR RATE</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dark-850/60">
          <tr
            v-for="row in queryResult.rows"
            :key="row.groupKey"
            class="hover:bg-dark-850/50 transition-colors"
          >
            <td class="py-2.5 px-3 text-slate-200 font-semibold truncate max-w-sm">
              {{ row.groupKey }}
            </td>

            <td class="py-2.5 px-3 text-right text-slate-300 font-bold">
              {{ row.count }}
            </td>

            <td class="py-2.5 px-3 min-w-[120px]">
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-slate-400 w-9">{{ row.percentage }}%</span>
                <div class="flex-1 bg-dark-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-brand-violet to-brand-cyan rounded-full"
                    :style="{ width: `${row.percentage}%` }"
                  ></div>
                </div>
              </div>
            </td>

            <td class="py-2.5 px-3 text-right">
              <span
                :class="row.avgLatency > 300 ? 'text-amber-400' : 'text-emerald-400'"
              >
                {{ formatLatency(row.avgLatency) }}
              </span>
            </td>

            <td class="py-2.5 px-3 text-right text-slate-400">
              {{ formatLatency(row.maxLatency) }}
            </td>

            <td class="py-2.5 px-3 text-right">
              <span
                :class="row.errorRate > 5 ? 'text-rose-400 font-bold' : 'text-slate-400'"
              >
                {{ row.errorRate }}%
              </span>
            </td>
          </tr>

          <tr v-if="queryResult.rows.length === 0">
            <td colspan="6" class="py-12 text-center text-slate-500 italic">
              No events matched this query specification.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


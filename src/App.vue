<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  LayoutDashboard,
  Radio,
  Sparkles,
  Bell,
  FlaskConical,
  Flame,
  CheckCircle,
  ExternalLink,
} from 'lucide-vue-next';
import { streamEngine } from './engine/streamEngine';
import { alertEngine } from './engine/alertEngine';
import HeaderNav from './components/layout/HeaderNav.vue';
import MetricCards from './components/layout/MetricCards.vue';
import ThroughputChart from './components/charts/ThroughputChart.vue';
import GeoPulseMap from './components/charts/GeoPulseMap.vue';
import LatencyDistribution from './components/charts/LatencyDistribution.vue';
import ConversionFunnel from './components/charts/ConversionFunnel.vue';
import BreakdownRings from './components/charts/BreakdownRings.vue';
import EventStreamView from './components/stream/EventStreamView.vue';
import QueryStudio from './components/query/QueryStudio.vue';
import AlertCenter from './components/alerts/AlertCenter.vue';
import SimulationLab from './components/simulator/SimulationLab.vue';

type TabKey = 'overview' | 'stream' | 'query' | 'alerts' | 'simulation';

const activeTab = ref<TabKey>('overview');

const tabs: { key: TabKey; label: string; icon: any; count?: () => number }[] = [
  { key: 'overview', label: 'Studio Overview', icon: LayoutDashboard },
  { key: 'stream', label: 'Live Stream', icon: Radio, count: () => streamEngine.recentEvents.value.length },
  { key: 'query', label: 'Query Explorer', icon: Sparkles },
  { key: 'alerts', label: 'Alerts & SLA', icon: Bell, count: () => alertEngine.activeIncidents.value.length },
  { key: 'simulation', label: 'Chaos & Ingestion Lab', icon: FlaskConical },
];

const activeIncidentCount = computed(() => alertEngine.activeIncidents.value.length);

onMounted(() => {
  streamEngine.start();
});

onUnmounted(() => {
  streamEngine.stop();
});
</script>

<template>
  <div class="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-brand-cyan/20 selection:text-brand-cyan">
    <!-- Top HUD Navigation -->
    <HeaderNav />

    <!-- Main Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col gap-6">
      <!-- Active Anomaly Incident Alert Bar (if breached) -->
      <div
        v-if="activeIncidentCount > 0 && activeTab !== 'alerts'"
        @click="activeTab = 'alerts'"
        class="bg-rose-500/10 border border-rose-500/40 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-rose-500/15 transition-all text-xs font-mono"
      >
        <div class="flex items-center gap-2.5 text-rose-400">
          <Flame class="w-4 h-4 animate-bounce" />
          <span class="font-bold">
            {{ activeIncidentCount }} ACTIVE SLA ANOMAL{{ activeIncidentCount > 1 ? 'IES' : 'Y' }} DETECTED
          </span>
          <span class="text-slate-400 hidden sm:inline">• Click to inspect alert triggers & thresholds</span>
        </div>
        <span class="text-rose-400 font-semibold underline">Review Alerts &rarr;</span>
      </div>

      <!-- Top KPI Metric Cards -->
      <MetricCards />

      <!-- Tab Pill Navigation -->
      <div class="flex items-center justify-between border-b border-dark-800 pb-2 overflow-x-auto">
        <div class="flex items-center gap-1.5 bg-dark-900/60 p-1 rounded-xl border border-dark-800">
          <button
            v-for="t in tabs"
            :key="t.key"
            @click="activeTab = t.key"
            :class="[
              'flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all',
              activeTab === t.key
                ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
            ]"
          >
            <component :is="t.icon" class="w-3.5 h-3.5" />
            <span>{{ t.label }}</span>
            <span
              v-if="t.count && t.count() > 0"
              :class="[
                'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                t.key === 'alerts' ? 'bg-rose-500 text-white font-bold' : 'bg-dark-800 text-slate-400'
              ]"
            >
              {{ t.count() }}
            </span>
          </button>
        </div>

        <div class="hidden md:flex items-center gap-3 text-xs font-mono text-slate-500">
          <span>Engine: <strong class="text-emerald-400">Reactive In-Memory Buffer</strong></span>
          <span>•</span>
          <span>Max Buffer: <strong class="text-slate-300">500 items</strong></span>
        </div>
      </div>

      <!-- Tab Content Panels -->
      <section class="flex-1">
        <!-- 1. Studio Overview Tab -->
        <div v-show="activeTab === 'overview'" class="space-y-6">
          <!-- Live Timeline Chart -->
          <ThroughputChart />

          <!-- Geo Map & Latency Histogram -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div class="lg:col-span-8">
              <GeoPulseMap />
            </div>
            <div class="lg:col-span-4">
              <LatencyDistribution />
            </div>
          </div>

          <!-- Funnel & Breakdown Rings -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div class="lg:col-span-6">
              <ConversionFunnel />
            </div>
            <div class="lg:col-span-6">
              <BreakdownRings />
            </div>
          </div>
        </div>

        <!-- 2. Live Stream Tab -->
        <div v-show="activeTab === 'stream'">
          <EventStreamView />
        </div>

        <!-- 3. Query Explorer Tab -->
        <div v-show="activeTab === 'query'">
          <QueryStudio />
        </div>

        <!-- 4. Alerts Tab -->
        <div v-show="activeTab === 'alerts'">
          <AlertCenter />
        </div>

        <!-- 5. Simulation & Ingestion Lab Tab -->
        <div v-show="activeTab === 'simulation'">
          <SimulationLab />
        </div>
      </section>
    </main>

    <!-- Sleek Studio Footer -->
    <footer class="border-t border-dark-800 bg-dark-900/50 py-4 px-4 lg:px-6 mt-12 text-xs font-mono text-slate-500">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-brand-emerald"></span>
          <span>Realtime Analytics Studio</span>
          <span>• Built with Vue 3 & TypeScript</span>
        </div>
        <div class="flex items-center gap-4">
          <span>Zero external heavy chart dependencies</span>
          <a
            href="https://github.com/jash15/realtime-analytics-studio"
            target="_blank"
            rel="noopener noreferrer"
            class="text-slate-400 hover:text-brand-cyan transition-colors flex items-center gap-1"
          >
            <span>github.com/jash15/realtime-analytics-studio</span>
            <ExternalLink class="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>


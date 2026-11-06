<script setup lang="ts">
import { ref } from 'vue';
import {
  Activity,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Flame,
  Github,
  Trash2,
} from 'lucide-vue-next';
import { streamEngine } from '../../engine/streamEngine';
import { alertEngine } from '../../engine/alertEngine';
import type { ScenarioMode } from '../../types/analytics';

const showExportMenu = ref(false);

const scenarios: { id: ScenarioMode; label: string; desc: string }[] = [
  { id: 'ecommerce', label: 'E-Commerce Store', desc: 'Catalog, search, cart, payments' },
  { id: 'fintech', label: 'Fintech Payments', desc: 'Transfers, balance, KYC, card auth' },
  { id: 'saas', label: 'SaaS Cloud API', desc: 'GraphQL, webhooks, teams, deployments' },
  { id: 'security', label: 'Cyber Defense', desc: 'WAF rules, token auth, brute-force' },
];

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showExportMenu.value = false;
}

function exportJSON() {
  const data = streamEngine.exportJSON();
  downloadFile(data, `analytics-stream-${Date.now()}.json`, 'application/json');
}

function exportCSV() {
  const data = streamEngine.exportCSV();
  downloadFile(data, `analytics-stream-${Date.now()}.csv`, 'text/csv');
}
</script>

<template>
  <header class="border-b border-dark-800 bg-dark-900/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-6 py-3">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
      <!-- Left: Logo & Live Status -->
      <div class="flex items-center gap-3">
        <div class="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-cyan/20 to-brand-emerald/20 border border-brand-cyan/30 text-brand-cyan shadow-lg shadow-brand-cyan/10">
          <Activity class="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Realtime</span>
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-emerald">Analytics Studio</span>
            </h1>
            <span class="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full border border-dark-700 bg-dark-800 text-slate-400">
              v1.0
            </span>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <!-- Pulsing Status Pill -->
            <div class="flex items-center gap-1.5">
              <span class="relative flex h-2 w-2">
                <span
                  v-if="streamEngine.isRunning.value"
                  class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  :class="streamEngine.chaos.errorSpikeActive ? 'bg-rose-400' : 'bg-brand-emerald'"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-2 w-2"
                  :class="[
                    !streamEngine.isRunning.value
                      ? 'bg-slate-500'
                      : streamEngine.chaos.errorSpikeActive
                      ? 'bg-rose-500'
                      : 'bg-brand-emerald'
                  ]"
                ></span>
              </span>
              <span class="font-mono text-[11px] font-medium" :class="streamEngine.isRunning.value ? 'text-emerald-400' : 'text-slate-400'">
                {{ streamEngine.isRunning.value ? 'STREAMING LIVE' : 'STREAM PAUSED' }}
              </span>
            </div>
            <span class="text-dark-700">•</span>
            <span class="font-mono text-[11px] text-slate-400">
              {{ streamEngine.currentSnapshot.eventsPerSec }} evt/s
            </span>
            <span v-if="streamEngine.chaos.ddosSpikeActive" class="text-xs font-mono font-bold text-amber-400 flex items-center gap-1 animate-pulse">
              <Flame class="w-3.5 h-3.5" /> SURGE
            </span>
          </div>
        </div>
      </div>

      <!-- Center: Scenario Mode Selector -->
      <div class="flex items-center gap-1.5 bg-dark-950/80 p-1 rounded-xl border border-dark-800">
        <button
          v-for="s in scenarios"
          :key="s.id"
          @click="streamEngine.setScenario(s.id)"
          :class="[
            'px-2.5 py-1 text-xs font-medium rounded-lg transition-all',
            streamEngine.scenario.value === s.id
              ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
          ]"
          :title="s.desc"
        >
          {{ s.label }}
        </button>
      </div>

      <!-- Right: Playback Speed, Pause/Play, Audio, Export -->
      <div class="flex items-center gap-2">
        <!-- Speed Multiplier Buttons -->
        <div class="hidden sm:flex items-center bg-dark-950/80 p-0.5 rounded-lg border border-dark-800 text-xs font-mono">
          <button
            v-for="spd in [1, 5, 15, 30]"
            :key="spd"
            @click="streamEngine.setSpeed(spd)"
            :class="[
              'px-2 py-1 rounded transition-colors',
              streamEngine.speedMultiplier.value === spd
                ? 'bg-dark-800 text-brand-cyan font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            {{ spd }}x
          </button>
        </div>

        <!-- Pause / Play Toggle -->
        <button
          @click="streamEngine.toggleRunning"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shadow-sm',
            streamEngine.isRunning.value
              ? 'bg-dark-850 hover:bg-dark-800 text-slate-200 border-dark-700'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          ]"
        >
          <component :is="streamEngine.isRunning.value ? Pause : Play" class="w-3.5 h-3.5" />
          <span>{{ streamEngine.isRunning.value ? 'Pause' : 'Resume' }}</span>
        </button>

        <!-- Sound Alert Toggle -->
        <button
          @click="alertEngine.toggleAudio"
          :class="[
            'p-2 rounded-lg border transition-all text-xs',
            alertEngine.audioAlertsEnabled.value
              ? 'bg-brand-violet/15 border-brand-violet/40 text-brand-violet shadow-sm'
              : 'bg-dark-850 border-dark-800 text-slate-400 hover:text-slate-200'
          ]"
          :title="alertEngine.audioAlertsEnabled.value ? 'Alert Sound Synthesizer On' : 'Alert Sound Muted'"
        >
          <component :is="alertEngine.audioAlertsEnabled.value ? Volume2 : VolumeX" class="w-4 h-4" />
        </button>

        <!-- Export Dropdown -->
        <div class="relative">
          <button
            @click="showExportMenu = !showExportMenu"
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-700 text-xs font-medium transition-colors"
          >
            <Download class="w-3.5 h-3.5" />
            <span class="hidden md:inline">Export</span>
          </button>

          <div
            v-if="showExportMenu"
            @click="showExportMenu = false"
            class="fixed inset-0 z-40"
          ></div>

          <div
            v-if="showExportMenu"
            class="absolute right-0 mt-2 w-48 rounded-xl bg-dark-900 border border-dark-700 shadow-2xl p-1 z-50 text-xs text-slate-200"
          >
            <button
              @click="exportJSON"
              class="w-full text-left px-3 py-2 rounded-lg hover:bg-dark-800 hover:text-brand-cyan transition-colors flex items-center justify-between"
            >
              <span>Export Stream (JSON)</span>
              <span class="text-[10px] text-slate-500 font-mono">.json</span>
            </button>
            <button
              @click="exportCSV"
              class="w-full text-left px-3 py-2 rounded-lg hover:bg-dark-800 hover:text-brand-cyan transition-colors flex items-center justify-between"
            >
              <span>Export Stream (CSV)</span>
              <span class="text-[10px] text-slate-500 font-mono">.csv</span>
            </button>
            <div class="border-t border-dark-800 my-1"></div>
            <button
              @click="streamEngine.clearBuffer()"
              class="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-2"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Clear Event Buffer</span>
            </button>
          </div>
        </div>

        <!-- GitHub Link -->
        <a
          href="https://github.com/jash15/realtime-analytics-studio"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-slate-300 hover:text-white text-xs font-medium transition-all"
        >
          <Github class="w-3.5 h-3.5" />
          <span>GitHub</span>
        </a>
      </div>
    </div>
  </header>
</template>


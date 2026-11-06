<script setup lang="ts">
import { computed } from 'vue';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sliders,
  ShieldCheck,
  Check,
  Trash2,
  Flame,
} from 'lucide-vue-next';
import { alertEngine } from '../../engine/alertEngine';
import { streamEngine } from '../../engine/streamEngine';
import { formatTime } from '../../utils/formatters';

const rules = computed(() => alertEngine.rules);
const activeIncidents = computed(() => alertEngine.activeIncidents.value);
const history = computed(() => alertEngine.incidentHistory.value);
</script>

<template>
  <div class="rounded-2xl bg-dark-900/80 border border-dark-800 p-4 lg:p-5 flex flex-col gap-5">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-dark-800">
      <div class="flex items-center gap-2">
        <div class="p-1.5 rounded-lg bg-brand-rose/10 text-brand-rose border border-brand-rose/20">
          <Bell class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-semibold text-white tracking-tight">Alerts & SLA Anomaly Engine</h2>
          <p class="text-xs text-slate-400">Automated threshold evaluation on every rolling telemetry cycle</p>
        </div>
      </div>

      <!-- Audio Alert Toggle -->
      <button
        @click="alertEngine.toggleAudio"
        :class="[
          'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono border transition-all',
          alertEngine.audioAlertsEnabled.value
            ? 'bg-brand-rose/15 border-brand-rose/40 text-brand-rose shadow-sm'
            : 'bg-dark-850 border-dark-700 text-slate-400 hover:text-slate-200'
        ]"
      >
        <component :is="alertEngine.audioAlertsEnabled.value ? Volume2 : VolumeX" class="w-4 h-4" />
        <span>{{ alertEngine.audioAlertsEnabled.value ? 'Synthesizer Audio Active' : 'Sound Muted' }}</span>
      </button>
    </div>

    <!-- Active Alerts Banner / Status -->
    <div
      v-if="activeIncidents.length > 0"
      class="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 space-y-3"
    >
      <div class="flex items-center justify-between text-xs font-mono">
        <span class="text-rose-400 font-bold flex items-center gap-2 text-sm">
          <Flame class="w-4 h-4 animate-bounce" />
          {{ activeIncidents.length }} ACTIVE INCIDENT{{ activeIncidents.length > 1 ? 'S' : '' }} DETECTED
        </span>
        <span class="text-slate-400 text-[11px]">Auto-resolves when metrics normalize</span>
      </div>

      <div class="space-y-2">
        <div
          v-for="inc in activeIncidents"
          :key="inc.id"
          class="flex flex-wrap items-center justify-between gap-3 bg-dark-900/90 border border-rose-500/30 p-3 rounded-lg"
        >
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <div>
              <span class="text-xs font-bold text-white">{{ inc.title }}</span>
              <div class="text-[11px] font-mono text-slate-400 mt-0.5">
                Current Value: <strong class="text-rose-400">{{ inc.currentValue }}</strong> (Threshold: {{ inc.threshold }})
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 text-xs font-mono">
            <span class="text-slate-500">{{ formatTime(inc.timestamp) }}</span>
            <button
              @click="alertEngine.acknowledgeIncident(inc.id)"
              class="px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 text-slate-200 hover:text-white transition-colors border border-dark-700 flex items-center gap-1"
            >
              <Check class="w-3.5 h-3.5" />
              <span>Ack</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between text-xs"
    >
      <div class="flex items-center gap-2.5 text-emerald-400">
        <ShieldCheck class="w-5 h-5" />
        <span class="font-medium">All telemetry channels nominal. No active SLA breaches.</span>
      </div>
      <span class="text-[11px] font-mono text-slate-500">Evaluated every 1s</span>
    </div>

    <!-- Threshold Rules Configuration -->
    <div class="space-y-3">
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
        Active Threshold Rules
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="rule in rules"
          :key="rule.id"
          class="bg-dark-950/60 p-4 rounded-xl border border-dark-800/80 flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-white">{{ rule.name }}</span>
              <!-- Toggle switch -->
              <button
                @click="alertEngine.toggleRule(rule.id)"
                :class="[
                  'w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none',
                  rule.enabled ? 'bg-brand-emerald' : 'bg-dark-700'
                ]"
              >
                <div
                  :class="[
                    'w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out',
                    rule.enabled ? 'translate-x-4' : 'translate-x-0'
                  ]"
                ></div>
              </button>
            </div>

            <p class="text-[11px] text-slate-400 mb-3">{{ rule.description }}</p>
          </div>

          <div class="pt-3 border-t border-dark-850">
            <div class="flex justify-between items-center text-xs font-mono mb-1.5">
              <span class="text-slate-400">Trigger Threshold:</span>
              <span class="text-brand-cyan font-bold">
                {{ rule.threshold }} {{ rule.metric === 'latency_p95' ? 'ms' : rule.metric === 'error_rate' ? '%' : 'eps' }}
              </span>
            </div>
            <!-- Slider -->
            <input
              type="range"
              :min="rule.metric === 'latency_p95' ? 50 : rule.metric === 'error_rate' ? 2 : 10"
              :max="rule.metric === 'latency_p95' ? 800 : rule.metric === 'error_rate' ? 30 : 150"
              :step="rule.metric === 'latency_p95' ? 25 : rule.metric === 'error_rate' ? 1 : 5"
              v-model.number="rule.threshold"
              class="w-full accent-brand-cyan h-1.5 bg-dark-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Resolved Incidents Audit History -->
    <div class="pt-2">
      <div class="flex items-center justify-between mb-2.5">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          Incident Audit Log History
        </h3>
        <button
          v-if="history.length > 0"
          @click="alertEngine.clearHistory"
          class="text-[11px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
        >
          <Trash2 class="w-3 h-3" />
          <span>Clear Log</span>
        </button>
      </div>

      <div class="rounded-xl border border-dark-800 bg-dark-950/60 overflow-hidden font-mono text-xs max-h-48 overflow-y-auto">
        <div
          v-for="inc in history"
          :key="inc.id"
          class="p-2.5 border-b border-dark-850/60 flex items-center justify-between text-slate-400 hover:bg-dark-850/30 transition-colors"
        >
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
            <span class="text-slate-200">{{ inc.title }}</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              RESOLVED
            </span>
          </div>
          <span class="text-[11px] text-slate-500">{{ formatTime(inc.timestamp) }}</span>
        </div>

        <div v-if="history.length === 0" class="p-6 text-center text-slate-500 italic">
          No past incidents recorded in this session.
        </div>
      </div>
    </div>
  </div>
</template>


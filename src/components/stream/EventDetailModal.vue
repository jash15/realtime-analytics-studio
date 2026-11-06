<script setup lang="ts">
import { ref } from 'vue';
import { X, Copy, Check, Terminal, Globe, Cpu, Clock, HardDrive } from 'lucide-vue-next';
import type { TelemetryEvent } from '../../types/analytics';
import { formatTime, formatLatency, getStatusCodeColor } from '../../utils/formatters';

const props = defineProps<{
  event: TelemetryEvent | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const copied = ref(false);

function copyJSON() {
  if (!props.event) return;
  navigator.clipboard.writeText(JSON.stringify(props.event, null, 2));
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1800);
}
</script>

<template>
  <div v-if="event" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-dark-950/80 backdrop-blur-sm">
    <div class="relative w-full max-w-2xl bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="p-4 border-b border-dark-800 flex items-center justify-between bg-dark-850/80">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
            <Terminal class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-white font-mono flex items-center gap-2">
              <span>{{ event.method }}</span>
              <span class="text-slate-300 font-normal">{{ event.endpoint }}</span>
            </h3>
            <span class="text-[11px] text-slate-500 font-mono">{{ event.id }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="copyJSON"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-mono transition-colors border border-dark-700"
          >
            <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" :class="copied ? 'text-emerald-400' : ''" />
            <span>{{ copied ? 'Copied' : 'Copy JSON' }}</span>
          </button>
          <button
            @click="emit('close')"
            class="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-colors border border-dark-700"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-dark-950/40 border-b border-dark-800 text-xs font-mono">
        <div class="p-2.5 rounded-xl bg-dark-900 border border-dark-800">
          <span class="text-slate-500 text-[10px] block mb-1">STATUS</span>
          <span
            class="px-2 py-0.5 rounded text-xs font-bold inline-block border"
            :class="[getStatusCodeColor(event.statusCode).text, getStatusCodeColor(event.statusCode).bg, getStatusCodeColor(event.statusCode).border]"
          >
            {{ event.statusCode }}
          </span>
        </div>

        <div class="p-2.5 rounded-xl bg-dark-900 border border-dark-800">
          <span class="text-slate-500 text-[10px] block mb-1">LATENCY</span>
          <span class="text-emerald-400 font-bold flex items-center gap-1">
            <Clock class="w-3.5 h-3.5" />
            {{ formatLatency(event.latencyMs) }}
          </span>
        </div>

        <div class="p-2.5 rounded-xl bg-dark-900 border border-dark-800">
          <span class="text-slate-500 text-[10px] block mb-1">REGION</span>
          <span class="text-cyan-400 font-medium flex items-center gap-1 truncate">
            <Globe class="w-3.5 h-3.5 flex-shrink-0" />
            {{ event.city }}, {{ event.countryCode }}
          </span>
        </div>

        <div class="p-2.5 rounded-xl bg-dark-900 border border-dark-800">
          <span class="text-slate-500 text-[10px] block mb-1">PAYLOAD SIZE</span>
          <span class="text-slate-200 font-medium flex items-center gap-1">
            <HardDrive class="w-3.5 h-3.5" />
            {{ event.bytes }} B
          </span>
        </div>
      </div>

      <!-- JSON Payload Viewer -->
      <div class="p-4 flex-1 overflow-y-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Telemetry Event Payload</span>
          <span class="text-[11px] text-slate-500 font-mono">{{ formatTime(event.timestamp) }}</span>
        </div>
        <pre class="bg-dark-950 p-4 rounded-xl border border-dark-800 text-xs font-mono text-emerald-400 overflow-x-auto selection:bg-emerald-500/20 leading-relaxed">{{ JSON.stringify(event, null, 2) }}</pre>
      </div>

      <!-- Client Attributes Footer -->
      <div class="p-3 border-t border-dark-800 bg-dark-850/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div class="flex items-center gap-3">
          <span>User: <strong class="text-slate-200">{{ event.userId }}</strong></span>
          <span>Device: <strong class="text-slate-200">{{ event.device }}</strong></span>
          <span>Browser: <strong class="text-slate-200">{{ event.browser }}</strong></span>
        </div>
        <button
          @click="emit('close')"
          class="px-3 py-1 rounded bg-dark-800 hover:bg-dark-700 text-slate-200 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
</template>


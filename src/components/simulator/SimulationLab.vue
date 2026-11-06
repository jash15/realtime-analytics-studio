<script setup lang="ts">
import { ref, reactive } from 'vue';
import {
  FlaskConical,
  Flame,
  AlertTriangle,
  Clock,
  Send,
  Code2,
  Copy,
  Check,
  CheckCircle,
} from 'lucide-vue-next';
import { streamEngine } from '../../engine/streamEngine';
import type { EventType, StatusCode } from '../../types/analytics';

const customEvent = reactive({
  endpoint: '/api/v1/payments/process',
  method: 'POST' as 'GET' | 'POST' | 'PUT' | 'DELETE',
  type: 'checkout' as EventType,
  statusCode: 200 as StatusCode,
  latencyMs: 145,
  city: 'San Francisco',
  country: 'United States',
  countryCode: 'US',
  userId: 'usr_custom_99',
  customJson: '{\n  "cartTotal": 149.99,\n  "coupon": "CYBER_SALE",\n  "currency": "USD"\n}',
});

const copiedCurl = ref(false);
const copiedFetch = ref(false);
const injectionSuccess = ref(false);

function injectCustom() {
  let parsedPayload: any = {};
  try {
    parsedPayload = JSON.parse(customEvent.customJson);
  } catch {
    parsedPayload = { error: 'Invalid JSON entered' };
  }

  streamEngine.ingestCustomEvent({
    endpoint: customEvent.endpoint,
    method: customEvent.method,
    type: customEvent.type,
    statusCode: customEvent.statusCode,
    latencyMs: customEvent.latencyMs,
    city: customEvent.city,
    country: customEvent.country,
    countryCode: customEvent.countryCode,
    userId: customEvent.userId,
    payload: parsedPayload,
  });

  injectionSuccess.value = true;
  setTimeout(() => {
    injectionSuccess.value = false;
  }, 1600);
}

function copySnippet(text: string, type: 'curl' | 'fetch') {
  navigator.clipboard.writeText(text);
  if (type === 'curl') {
    copiedCurl.value = true;
    setTimeout(() => { copiedCurl.value = false; }, 1800);
  } else {
    copiedFetch.value = true;
    setTimeout(() => { copiedFetch.value = false; }, 1800);
  }
}

const curlSnippet = `curl -X POST https://your-analytics-host.io/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "endpoint": "/api/v1/orders",
    "method": "POST",
    "statusCode": 200,
    "latencyMs": 85,
    "userId": "usr_7891",
    "countryCode": "US"
  }'`;

const fetchSnippet = `// Send real-time telemetry from frontend or node backend
await fetch('/api/telemetry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    timestamp: Date.now(),
    endpoint: window.location.pathname,
    latencyMs: performance.now(),
    device: navigator.userAgentData?.mobile ? 'mobile' : 'desktop'
  })
});`;
</script>

<template>
  <div class="rounded-2xl bg-dark-900/80 border border-dark-800 p-4 lg:p-5 flex flex-col gap-5">
    <!-- Header -->
    <div class="flex items-center gap-2 pb-3 border-b border-dark-800">
      <div class="p-1.5 rounded-lg bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
        <FlaskConical class="w-4 h-4" />
      </div>
      <div>
        <h2 class="text-sm font-semibold text-white tracking-tight">Simulation & Chaos Lab</h2>
        <p class="text-xs text-slate-400">Inject synthetic stress tests, anomalies & custom telemetry events</p>
      </div>
    </div>

    <!-- Chaos Triggers Grid -->
    <div>
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono mb-3">
        Chaos Engineering Scenarios
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 1. Latency Surge -->
        <div
          class="p-4 rounded-xl border transition-all flex flex-col justify-between"
          :class="streamEngine.chaos.latencySurgeActive ? 'bg-amber-500/10 border-amber-500/40' : 'bg-dark-950/60 border-dark-800/80'"
        >
          <div>
            <div class="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
              <Clock class="w-4 h-4" />
              <span>Database Latency Surge</span>
            </div>
            <p class="text-[11px] text-slate-400 mb-3">
              Simulates database lockups and connection pool starvation by adding +500ms to all endpoints.
            </p>
          </div>
          <button
            @click="streamEngine.toggleLatencySurge"
            :class="[
              'w-full py-2 rounded-lg text-xs font-mono font-semibold transition-all border',
              streamEngine.chaos.latencySurgeActive
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-dark-850 hover:bg-dark-800 border-dark-700 text-amber-400'
            ]"
          >
            {{ streamEngine.chaos.latencySurgeActive ? '⚡ Surge Active (Click to Stop)' : 'Trigger Latency Surge' }}
          </button>
        </div>

        <!-- 2. Error Outage Spike -->
        <div
          class="p-4 rounded-xl border transition-all flex flex-col justify-between"
          :class="streamEngine.chaos.errorSpikeActive ? 'bg-rose-500/10 border-rose-500/40' : 'bg-dark-950/60 border-dark-800/80'"
        >
          <div>
            <div class="flex items-center gap-2 text-rose-400 font-bold text-xs mb-1">
              <AlertTriangle class="w-4 h-4" />
              <span>5xx Microservice Outage</span>
            </div>
            <p class="text-[11px] text-slate-400 mb-3">
              Forces 45% failure rate (500, 502, 503) simulating downstream upstream cluster degradation.
            </p>
          </div>
          <button
            @click="streamEngine.toggleErrorSpike"
            :class="[
              'w-full py-2 rounded-lg text-xs font-mono font-semibold transition-all border',
              streamEngine.chaos.errorSpikeActive
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                : 'bg-dark-850 hover:bg-dark-800 border-dark-700 text-rose-400'
            ]"
          >
            {{ streamEngine.chaos.errorSpikeActive ? '💥 Outage Active (Click to Stop)' : 'Trigger 5xx Failure Spike' }}
          </button>
        </div>

        <!-- 3. Traffic Surge / DDoS -->
        <div
          class="p-4 rounded-xl border transition-all flex flex-col justify-between"
          :class="streamEngine.chaos.ddosSpikeActive ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-dark-950/60 border-dark-800/80'"
        >
          <div>
            <div class="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-1">
              <Flame class="w-4 h-4" />
              <span>DDoS / Flash Sale Surge</span>
            </div>
            <p class="text-[11px] text-slate-400 mb-3">
              Triggers an instantaneous 500% ingress volume burst for 6 seconds to stress buffer limits.
            </p>
          </div>
          <button
            @click="streamEngine.triggerDdosSpike"
            :disabled="streamEngine.chaos.ddosSpikeActive"
            :class="[
              'w-full py-2 rounded-lg text-xs font-mono font-semibold transition-all border',
              streamEngine.chaos.ddosSpikeActive
                ? 'bg-cyan-500 text-black border-cyan-400 animate-pulse'
                : 'bg-dark-850 hover:bg-dark-800 border-dark-700 text-cyan-400'
            ]"
          >
            {{ streamEngine.chaos.ddosSpikeActive ? '🔥 Influx Surge Running...' : 'Burst Influx (+500% RPS)' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Custom Event Ingestion Form -->
    <div class="bg-dark-950/60 p-4 rounded-xl border border-dark-800/80">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          Inject Custom Telemetry Event
        </h3>
        <span v-if="injectionSuccess" class="text-xs font-mono text-emerald-400 flex items-center gap-1">
          <CheckCircle class="w-3.5 h-3.5" /> Event Ingested!
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono mb-3">
        <!-- Endpoint -->
        <div class="sm:col-span-2">
          <label class="block text-slate-500 text-[10px] mb-1">ENDPOINT PATH</label>
          <input
            v-model="customEvent.endpoint"
            type="text"
            class="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-emerald"
          />
        </div>

        <!-- Method -->
        <div>
          <label class="block text-slate-500 text-[10px] mb-1">METHOD</label>
          <select
            v-model="customEvent.method"
            class="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-emerald"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-slate-500 text-[10px] mb-1">STATUS CODE</label>
          <input
            v-model.number="customEvent.statusCode"
            type="number"
            class="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-emerald"
          />
        </div>

        <!-- Latency -->
        <div>
          <label class="block text-slate-500 text-[10px] mb-1">LATENCY (MS)</label>
          <input
            v-model.number="customEvent.latencyMs"
            type="number"
            class="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-emerald"
          />
        </div>

        <!-- City -->
        <div>
          <label class="block text-slate-500 text-[10px] mb-1">CITY / REGION</label>
          <input
            v-model="customEvent.city"
            type="text"
            class="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-emerald"
          />
        </div>
      </div>

      <!-- JSON Payload Editor -->
      <div class="mb-3">
        <label class="block text-slate-500 text-[10px] mb-1 font-mono">CUSTOM JSON PAYLOAD</label>
        <textarea
          v-model="customEvent.customJson"
          rows="3"
          class="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-emerald-400 font-mono text-xs focus:outline-none focus:border-brand-emerald resize-none"
        ></textarea>
      </div>

      <!-- Dispatch Button -->
      <div class="flex justify-end">
        <button
          @click="injectCustom"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-400 text-dark-950 font-semibold text-xs font-mono transition-colors shadow-lg shadow-brand-emerald/20"
        >
          <Send class="w-3.5 h-3.5" />
          <span>Dispatch Synthetic Event</span>
        </button>
      </div>
    </div>

    <!-- Integration Code Snippets -->
    <div>
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
        <Code2 class="w-4 h-4 text-brand-cyan" />
        Real-World Integration Code
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- curl snippet -->
        <div class="bg-dark-950/60 p-3 rounded-xl border border-dark-800 text-xs font-mono">
          <div class="flex items-center justify-between mb-2">
            <span class="text-slate-400">cURL Terminal Ingestion</span>
            <button
              @click="copySnippet(curlSnippet, 'curl')"
              class="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[11px]"
            >
              <component :is="copiedCurl ? Check : Copy" class="w-3 h-3" />
              <span>{{ copiedCurl ? 'Copied' : 'Copy' }}</span>
            </button>
          </div>
          <pre class="text-brand-cyan overflow-x-auto text-[11px] p-2 bg-dark-900 rounded-lg">{{ curlSnippet }}</pre>
        </div>

        <!-- fetch snippet -->
        <div class="bg-dark-950/60 p-3 rounded-xl border border-dark-800 text-xs font-mono">
          <div class="flex items-center justify-between mb-2">
            <span class="text-slate-400">JavaScript / TypeScript Client</span>
            <button
              @click="copySnippet(fetchSnippet, 'fetch')"
              class="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[11px]"
            >
              <component :is="copiedFetch ? Check : Copy" class="w-3 h-3" />
              <span>{{ copiedFetch ? 'Copied' : 'Copy' }}</span>
            </button>
          </div>
          <pre class="text-brand-emerald overflow-x-auto text-[11px] p-2 bg-dark-900 rounded-lg">{{ fetchSnippet }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

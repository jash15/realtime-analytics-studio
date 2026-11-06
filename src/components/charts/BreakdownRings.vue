<script setup lang="ts">
import { computed } from 'vue';
import { Layers, Smartphone, Monitor, Tablet } from 'lucide-vue-next';
import { streamEngine } from '../../engine/streamEngine';

const totalEvents = computed(() => streamEngine.recentEvents.value.length || 1);

const statuses = computed(() => {
  const map = streamEngine.statusBreakdown.value;
  const entries = Object.entries(map).map(([code, count]) => ({
    code,
    count,
    num: Number(code),
    percent: Math.round((count / totalEvents.value) * 100),
  }));
  entries.sort((a, b) => b.count - a.count);
  return entries;
});

const devices = computed(() => {
  const d = streamEngine.deviceBreakdown.value;
  return [
    { label: 'Desktop', key: 'desktop', count: d.desktop || 0, icon: Monitor, color: 'bg-brand-cyan' },
    { label: 'Mobile', key: 'mobile', count: d.mobile || 0, icon: Smartphone, color: 'bg-brand-emerald' },
    { label: 'Tablet', key: 'tablet', count: d.tablet || 0, icon: Tablet, color: 'bg-brand-violet' },
  ];
});

const browsers = computed(() => {
  const b = streamEngine.browserBreakdown.value;
  return Object.entries(b)
    .map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / totalEvents.value) * 100),
    }))
    .sort((a, b) => b.count - a.count);
});

function getStatusCodeClass(code: number) {
  if (code < 300) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (code < 400) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
  if (code < 500) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
}
</script>

<template>
  <div class="rounded-2xl bg-dark-900/80 border border-dark-800 p-4 lg:p-5">
    <div class="flex items-center gap-2 mb-4">
      <div class="p-1.5 rounded-lg bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
        <Layers class="w-4 h-4" />
      </div>
      <div>
        <h2 class="text-sm font-semibold text-white tracking-tight">Traffic Breakdown</h2>
        <p class="text-xs text-slate-400">Status codes, devices & browsers</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. Status Codes -->
      <div class="bg-dark-950/60 p-3 rounded-xl border border-dark-800/80">
        <span class="text-xs font-semibold text-slate-300 block mb-2.5">HTTP Status Codes</span>
        <div class="space-y-2">
          <div
            v-for="st in statuses.slice(0, 4)"
            :key="st.code"
            class="flex items-center justify-between text-xs font-mono"
          >
            <span :class="['px-1.5 py-0.5 rounded border text-[11px] font-bold', getStatusCodeClass(st.num)]">
              {{ st.code }}
            </span>
            <span class="text-slate-400">{{ st.count }} ({{ st.percent }}%)</span>
          </div>
          <div v-if="statuses.length === 0" class="text-xs text-slate-500 italic">
            Waiting for events...
          </div>
        </div>
      </div>

      <!-- 2. Devices -->
      <div class="bg-dark-950/60 p-3 rounded-xl border border-dark-800/80">
        <span class="text-xs font-semibold text-slate-300 block mb-2.5">Device Types</span>
        <div class="space-y-2.5">
          <div v-for="dev in devices" :key="dev.key" class="text-xs">
            <div class="flex items-center justify-between mb-1 font-mono text-[11px]">
              <span class="text-slate-300 flex items-center gap-1.5">
                <component :is="dev.icon" class="w-3.5 h-3.5 text-slate-400" />
                {{ dev.label }}
              </span>
              <span class="text-slate-400">{{ Math.round((dev.count / totalEvents) * 100) }}%</span>
            </div>
            <div class="w-full bg-dark-900 h-1.5 rounded-full overflow-hidden">
              <div
                :class="['h-full rounded-full transition-all duration-300', dev.color]"
                :style="{ width: `${Math.round((dev.count / totalEvents) * 100)}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Browsers -->
      <div class="bg-dark-950/60 p-3 rounded-xl border border-dark-800/80">
        <span class="text-xs font-semibold text-slate-300 block mb-2.5">Client User Agents</span>
        <div class="space-y-2">
          <div
            v-for="b in browsers.slice(0, 4)"
            :key="b.name"
            class="flex items-center justify-between text-xs font-mono"
          >
            <span class="text-slate-300">{{ b.name }}</span>
            <div class="flex items-center gap-2">
              <span class="text-slate-400">{{ b.percent }}%</span>
              <div class="w-12 bg-dark-900 h-1.5 rounded-full overflow-hidden">
                <div
                  class="bg-brand-violet h-full rounded-full"
                  :style="{ width: `${b.percent}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


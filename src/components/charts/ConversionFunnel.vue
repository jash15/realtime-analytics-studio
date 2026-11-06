<script setup lang="ts">
import { computed } from 'vue';
import { Filter, ArrowDownRight, CheckCircle } from 'lucide-vue-next';
import { streamEngine } from '../../engine/streamEngine';

const stages = computed(() => streamEngine.funnelStages.value);
</script>

<template>
  <div class="rounded-2xl bg-dark-900/80 border border-dark-800 p-4 lg:p-5 flex flex-col justify-between">
    <div>
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-brand-amber/10 text-brand-amber border border-brand-amber/20">
            <Filter class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-white tracking-tight">Realtime Conversion Pipeline</h2>
            <p class="text-xs text-slate-400">User lifecycle drop-off rate</p>
          </div>
        </div>
      </div>

      <!-- Funnel Stages -->
      <div class="space-y-3 mt-4">
        <div
          v-for="(stage, idx) in stages"
          :key="stage.key"
          class="relative bg-dark-950/60 p-2.5 rounded-xl border border-dark-800/80"
        >
          <div class="flex items-center justify-between text-xs mb-1.5 font-mono">
            <span class="text-slate-300 font-medium flex items-center gap-1.5">
              <span class="w-4 h-4 rounded-full bg-dark-800 text-[10px] flex items-center justify-center text-slate-400">
                {{ idx + 1 }}
              </span>
              {{ stage.name }}
            </span>
            <div class="flex items-center gap-2 text-[11px]">
              <span class="text-slate-400 font-semibold">{{ stage.count }}</span>
              <span class="text-emerald-400 font-bold">{{ stage.conversionPercent }}%</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-dark-900 h-2 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-brand-amber via-brand-cyan to-brand-emerald rounded-full transition-all duration-300"
              :style="{ width: `${Math.max(3, stage.conversionPercent)}%` }"
            ></div>
          </div>

          <!-- Dropoff indicator between stages -->
          <div
            v-if="idx > 0 && stage.dropoffPercent > 0"
            class="text-[10px] font-mono text-rose-400/80 mt-1 flex items-center gap-1 justify-end"
          >
            <ArrowDownRight class="w-3 h-3" />
            <span>-{{ stage.dropoffPercent }}% drop-off</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom summary -->
    <div class="mt-4 pt-3 border-t border-dark-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
      <span class="flex items-center gap-1 text-emerald-400">
        <CheckCircle class="w-3 h-3" /> E2E Conversion
      </span>
      <span class="font-bold text-white">
        {{ stages.length ? stages[stages.length - 1].conversionPercent : 0 }}% Final Rate
      </span>
    </div>
  </div>
</template>

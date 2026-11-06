export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'k';
  }
  return num.toLocaleString();
}

export function formatLatency(ms: number): string {
  if (ms < 1) return '<1 ms';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatThroughput(kbps: number): string {
  if (kbps < 1024) return `${kbps.toFixed(1)} KB/s`;
  return `${(kbps / 1024).toFixed(2)} MB/s`;
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0').slice(0, 2);
}

export function getStatusCodeColor(code: number): { text: string; bg: string; border: string } {
  if (code >= 200 && code < 300) {
    return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
  }
  if (code >= 300 && code < 400) {
    return { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' };
  }
  if (code >= 400 && code < 500) {
    return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
  }
  return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
}


import type { TelemetryEvent, EventType } from '../types/analytics';

export interface QueryFilter {
  type?: EventType | 'all';
  statusCodeFilter?: 'all' | '2xx' | '3xx' | '4xx' | '5xx' | 'errors';
  country?: string;
  endpointQuery?: string;
  minLatency?: number;
}

export type GroupByField = 'endpoint' | 'country' | 'statusCode' | 'browser' | 'device';

export interface AggregateRow {
  groupKey: string;
  count: number;
  avgLatency: number;
  maxLatency: number;
  errorCount: number;
  errorRate: number;
  percentage: number;
}

export class QueryEngine {
  public static execute(
    events: TelemetryEvent[],
    filter: QueryFilter,
    groupBy: GroupByField
  ): { rows: AggregateRow[]; totalFiltered: number } {
    // 1. Filter
    const filtered = events.filter(e => {
      if (filter.type && filter.type !== 'all' && e.type !== filter.type) return false;

      if (filter.statusCodeFilter && filter.statusCodeFilter !== 'all') {
        if (filter.statusCodeFilter === '2xx' && (e.statusCode < 200 || e.statusCode >= 300)) return false;
        if (filter.statusCodeFilter === '3xx' && (e.statusCode < 300 || e.statusCode >= 400)) return false;
        if (filter.statusCodeFilter === '4xx' && (e.statusCode < 400 || e.statusCode >= 500)) return false;
        if (filter.statusCodeFilter === '5xx' && e.statusCode < 500) return false;
        if (filter.statusCodeFilter === 'errors' && e.statusCode < 400) return false;
      }

      if (filter.country && filter.country !== 'all' && e.countryCode !== filter.country) return false;

      if (filter.endpointQuery && filter.endpointQuery.trim()) {
        const q = filter.endpointQuery.toLowerCase().trim();
        if (!e.endpoint.toLowerCase().includes(q)) return false;
      }

      if (filter.minLatency && e.latencyMs < filter.minLatency) return false;

      return true;
    });

    const totalFiltered = filtered.length;
    if (totalFiltered === 0) {
      return { rows: [], totalFiltered: 0 };
    }

    // 2. Group By
    const groupMap = new Map<string, { count: number; sumLatency: number; maxLatency: number; errorCount: number }>();

    for (const e of filtered) {
      let key = '';
      if (groupBy === 'endpoint') key = e.endpoint;
      else if (groupBy === 'country') key = `${e.country} (${e.countryCode})`;
      else if (groupBy === 'statusCode') key = String(e.statusCode);
      else if (groupBy === 'browser') key = e.browser;
      else if (groupBy === 'device') key = e.device;

      const curr = groupMap.get(key) || { count: 0, sumLatency: 0, maxLatency: 0, errorCount: 0 };
      curr.count++;
      curr.sumLatency += e.latencyMs;
      if (e.latencyMs > curr.maxLatency) curr.maxLatency = e.latencyMs;
      if (e.statusCode >= 400) curr.errorCount++;
      groupMap.set(key, curr);
    }

    // 3. Format rows
    const rows: AggregateRow[] = [];
    for (const [key, data] of groupMap.entries()) {
      const avgLatency = Math.round(data.sumLatency / data.count);
      const errorRate = Number(((data.errorCount / data.count) * 100).toFixed(1));
      const percentage = Number(((data.count / totalFiltered) * 100).toFixed(1));

      rows.push({
        groupKey: key,
        count: data.count,
        avgLatency,
        maxLatency: data.maxLatency,
        errorCount: data.errorCount,
        errorRate,
        percentage,
      });
    }

    // Sort by count descending
    rows.sort((a, b) => b.count - a.count);

    return { rows, totalFiltered };
  }
}


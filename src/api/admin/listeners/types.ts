export interface ListenerPerformanceRow {
  listenerId: string;
  name: string;
  email: string;
  active: boolean;
  pending: number;
  successful: number;
  unsuccessful: number;
  cancelled: number;
  settled: number;
  completionRate: number | null;
  cancellationRate: number | null;
  unsuccessfulRate: number | null;
}

export interface ListenerPerformanceResult {
  from: string;
  to: string;
  listeners: ListenerPerformanceRow[];
}

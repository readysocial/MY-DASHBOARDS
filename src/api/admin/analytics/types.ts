export interface AnalyticsOverview {
  totalSparksNotRedeemed: number;
  totalWalletsCount: number;
  activeWalletsCount: number;
  totalPurchased: number;
  totalRedeemed: number;
  totalGifted: number;
  activeUsers30d: number;
  totalSessions: number;
}

export interface AnalyticsSeriesPoint {
  period: string;
  sessions: number;
  sparksPurchased: number;
  sparksRedeemed: number;
}

export interface AnalyticsResponse {
  overview: AnalyticsOverview;
  series: AnalyticsSeriesPoint[];
}

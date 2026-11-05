export interface PricingConfig {
  pricePerSpark: number;
  currency: string;
  sessionCost: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface PricingConfigUpdate {
  pricePerSpark?: number;
  currency?: string;
  sessionCost?: number;
}

export type PaymentPlatform = "android" | "ios" | "web";
export type PaymentMethodId = "paystack" | "web";

export interface PaymentMethodCatalogEntry {
  id: PaymentMethodId;
  kind: "provider" | "website";
  label: string;
  description: string;
  providerName?: string;
}

export type PaymentMethodsConfig = Record<PaymentPlatform, PaymentMethodId[]>;

export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethodsConfig;
  platforms: PaymentPlatform[];
  catalog: PaymentMethodCatalogEntry[];
}

export interface PaymentMethodsUpdate {
  paymentMethods: PaymentMethodsConfig;
}

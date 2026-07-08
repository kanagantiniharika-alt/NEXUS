import { MerchantTrustReport, PurchaseReport } from "../types";

/**
 * SerpApiService
 * 
 * Secure full-stack client-side service layer wrapper that manages
 * interactions with our backend, proxy-secured SerpApi routing infrastructure.
 * 
 * Since SerpApi calls require a secret API key (SERP_API_KEY) which must NEVER
 * be exposed directly in client bundles, this service routes queries through 
 * server-side controller pathways which wrap:
 *  - Google Shopping Engine (SerpApi 'google_shopping') for purchase comparison & product audits
 *  - Google Maps Engine (SerpApi 'google_maps') for business verification & storefront auditing
 *  - Google Trends Engine (SerpApi 'google_trends') for interest trend over-time telemetry
 *  - Google Search Engine (SerpApi 'google' with news option) for news headlines on fraud safety audits
 */
class SerpApiService {
  
  /**
   * Google Shopping client proxy:
   * Retrieves live catalog values, ratings, and comparative parameters for a specified item.
   */
  async queryGoogleShopping(productName: string, price: number | string, purpose: string): Promise<PurchaseReport> {
    const response = await fetch("/api/purchase-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName, price, purpose }),
    });

    if (!response.ok) {
      throw new Error(`SerpApi Shopping Error: Server status ${response.status}`);
    }
    return response.json();
  }

  /**
   * Google Maps and Google Search store physical/virtual legitimacy check:
   * Analyzes live verified maps coordinates, local search ratings, and web safety parameters.
   */
  async queryGoogleMapsAndSearch(merchantName: string): Promise<MerchantTrustReport> {
    const response = await fetch("/api/fraud/merchant-trust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantName }),
    });

    if (!response.ok) {
      throw new Error(`SerpApi Store Audit Error: Server status ${response.status}`);
    }
    return response.json();
  }

  /**
   * Google Trends and Google Search News emerging fraud checks:
   * Gets interest volumes & raw web warning signals regarding cyber scam threats, phishes, or UPI spoofs.
   */
  async queryScamTrends(): Promise<any[]> {
    const response = await fetch("/api/fraud/scam-trends");
    if (!response.ok) {
      throw new Error(`SerpApi Trends Error: Server status ${response.status}`);
    }
    return response.json();
  }

  /**
   * Google Trends & Search insights regarding overall spending and budget parameters:
   * Feeds the local spending analysis dashboard with real-time financial tips.
   */
  async querySpendingTrends(): Promise<{ insights: string[]; notifications: any }> {
    const response = await fetch("/api/spending/trend-analysis");
    if (!response.ok) {
      throw new Error(`SerpApi Search & Insights Error: Server status ${response.status}`);
    }
    return response.json();
  }

  /**
   * Retrieves daily request volume and virtual token usage stats across connected SerpApi engines.
   */
  async getStats(): Promise<any[]> {
    const response = await fetch("/api/serpapi/stats");
    if (!response.ok) {
      throw new Error(`SerpApi Stats Error: Server status ${response.status}`);
    }
    return response.json();
  }
}

export const serpApiService = new SerpApiService();

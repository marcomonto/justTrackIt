/**
 * Supported currencies for price tracking
 */
export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  CHF = 'CHF',
}

export interface ScraperResult {
  price: number;
  currency: Currency;
  isAvailable: boolean;
  title?: string;
  imageUrl?: string;
  sku?: string;
}

export interface Scraper {
  scrape(url: string): Promise<ScraperResult>;
  canHandle(url: string): boolean;
  getStoreName(): string;
}

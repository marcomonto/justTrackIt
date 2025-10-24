export interface ScraperResult {
  price: number;
  currency: string;
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

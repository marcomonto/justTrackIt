import { Injectable, Logger } from '@nestjs/common';
import { ScraperFactory } from './scraper.factory';
import { ScraperResult } from './interfaces/scraper.interface';

@Injectable()
export class ScrapersService {
  private readonly logger = new Logger(ScrapersService.name);
  private readonly lastScrapeTime: Map<string, number> = new Map();
  private readonly minDelayBetweenScrapes = 5000; // 5 seconds

  constructor(private readonly scraperFactory: ScraperFactory) {}

  async scrapeProduct(url: string): Promise<ScraperResult> {
    // Rate limiting per domain
    await this.enforceRateLimit(url);

    // Get appropriate scraper from factory based on domain
    const scraper = this.scraperFactory.getScraperForUrl(url);

    this.logger.log(`Using ${scraper.getStoreName()} scraper for ${url}`);

    try {
      const result = await scraper.scrape(url);
      this.logger.log(
        `Successfully scraped ${url}: ${result.price} ${result.currency}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to scrape ${url}: ${error.message}`);
      throw error;
    }
  }

  private async enforceRateLimit(url: string): Promise<void> {
    try {
      const domain = new URL(url).hostname;
      const lastScrape = this.lastScrapeTime.get(domain);

      if (lastScrape) {
        const timeSinceLastScrape = Date.now() - lastScrape;
        if (timeSinceLastScrape < this.minDelayBetweenScrapes) {
          const delay = this.minDelayBetweenScrapes - timeSinceLastScrape;
          this.logger.log(`Rate limiting: waiting ${delay}ms for ${domain}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      this.lastScrapeTime.set(domain, Date.now());
    } catch (error) {
      // Invalid URL, skip rate limiting
      this.logger.warn(`Invalid URL for rate limiting: ${url}`);
    }
  }

  getSupportedStores(): string[] {
    return this.scraperFactory.getSupportedStores();
  }
}

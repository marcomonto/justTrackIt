import { Injectable, Logger } from '@nestjs/common';
import { AmazonScraper } from './adapters/amazon.scraper';
import { EbayScraper } from './adapters/ebay.scraper';
import { GenericScraper } from './adapters/generic.scraper';
import { Scraper, ScraperResult } from './interfaces/scraper.interface';

@Injectable()
export class ScrapersService {
  private readonly logger = new Logger(ScrapersService.name);
  private readonly scrapers: Scraper[];
  private readonly lastScrapeTime: Map<string, number> = new Map();
  private readonly minDelayBetweenScrapes = 5000; // 5 seconds

  constructor(
    private readonly amazonScraper: AmazonScraper,
    private readonly ebayScraper: EbayScraper,
    private readonly genericScraper: GenericScraper,
  ) {
    // Order matters: specific scrapers first, generic last
    this.scrapers = [
      this.amazonScraper,
      this.ebayScraper,
      this.genericScraper,
    ];
  }

  async scrapeProduct(url: string): Promise<ScraperResult> {
    // Rate limiting per domain
    await this.enforceRateLimit(url);

    // Find appropriate scraper
    const scraper = this.scrapers.find((s) => s.canHandle(url));

    if (!scraper) {
      throw new Error('No suitable scraper found for URL');
    }

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
    return this.scrapers
      .map((s) => s.getStoreName())
      .filter((name) => name !== 'Generic');
  }
}

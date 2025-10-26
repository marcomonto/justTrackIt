import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AmazonScraper } from './adapters/amazon.scraper';
import { EbayScraper } from './adapters/ebay.scraper';
import { LookfantasticScraper } from './adapters/lookfantastic.scraper';
import { ZalandoScraper } from './adapters/zalando.scraper';
import { SephoraScraper } from './adapters/sephora.scraper';
import { GenericScraper } from './adapters/generic.scraper';
import { Scraper } from './interfaces/scraper.interface';

/**
 * Configuration for domain pattern matching
 */
interface ScraperConfig {
  pattern: RegExp;
  scraperClass: Type<Scraper>;
  name: string;
}

/**
 * Factory that creates the appropriate scraper based on the URL domain
 * Uses NestJS ModuleRef to resolve scrapers from the DI container
 * Similar to Laravel's app() helper
 */
@Injectable()
export class ScraperFactory {
  private readonly logger = new Logger(ScraperFactory.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Registry of scraper configurations
   * Add new scrapers here to automatically support them
   */
  private readonly scraperRegistry: ScraperConfig[] = [
    {
      pattern: /^amazon\.[a-z.]+$/i,
      scraperClass: AmazonScraper,
      name: 'Amazon',
    },
    {
      pattern: /^ebay\.[a-z.]+$/i,
      scraperClass: EbayScraper,
      name: 'eBay',
    },
    {
      pattern: /^(www\.)?lookfantastic\.[a-z.]+$/i,
      scraperClass: LookfantasticScraper,
      name: 'Lookfantastic',
    },
    {
      pattern: /^(www\.)?zalando\.[a-z.]+$/i,
      scraperClass: ZalandoScraper,
      name: 'Zalando',
    },
    {
      pattern: /^(www\.)?sephora\.[a-z.]+$/i,
      scraperClass: SephoraScraper,
      name: 'Sephora',
    },
  ];

  /**
   * Returns the appropriate scraper for the given URL
   * Resolves scraper from DI container using ModuleRef (like Laravel's app())
   * @param url The product URL to scrape
   * @returns Scraper instance resolved from the container
   */
  getScraperForUrl(url: string): Scraper {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Remove 'www.' prefix if present
      const domain = hostname.replace(/^www\./, '');

      this.logger.debug(`Finding scraper for domain: ${domain}`);

      // Find matching scraper configuration
      for (const config of this.scraperRegistry) {
        if (config.pattern.test(domain)) {
          this.logger.log(`Using ${config.name}Scraper for ${domain}`);
          // Resolve from DI container as singleton (like Laravel's app(ScraperClass::class))
          return this.moduleRef.get(config.scraperClass);
        }
      }

      // Fallback to generic scraper
      this.logger.log(`Using GenericScraper for ${domain}`);
      return this.moduleRef.get(GenericScraper);
    } catch (error) {
      this.logger.warn(`Invalid URL: ${url}, using GenericScraper`);
      return this.moduleRef.get(GenericScraper);
    }
  }

  /**
   * Get list of supported store names
   */
  getSupportedStores(): string[] {
    return this.scraperRegistry.map((config) => config.name);
  }
}
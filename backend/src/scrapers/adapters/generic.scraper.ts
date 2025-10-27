import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  Scraper,
  ScraperResult,
  Currency,
} from '../interfaces/scraper.interface';
import { parsePrice } from '../utils/price-parser.util';

@Injectable()
export class GenericScraper implements Scraper {
  private readonly logger = new Logger(GenericScraper.name);

  canHandle(url: string): boolean {
    // Fallback scraper - handles any URL
    return true;
  }

  getStoreName(): string {
    return 'Generic';
  }

  async scrape(url: string): Promise<ScraperResult> {
    try {
      this.logger.log(`Scraping generic product: ${url}`);

      const { data } = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(data);

      // Cerca comuni pattern per prezzi
      let price: number | null = null;
      const priceSelectors = [
        '[itemprop="price"]',
        '.price',
        '.product-price',
        '[class*="price"]',
        '[id*="price"]',
        '[data-price]',
      ];

      for (const selector of priceSelectors) {
        const elements = $(selector);
        for (let i = 0; i < elements.length; i++) {
          const priceText =
            $(elements[i]).attr('content') ||
            $(elements[i]).text().trim() ||
            $(elements[i]).attr('data-price');

          if (priceText) {
            const priceMatch = priceText.match(/[\d.,]+/);
            if (priceMatch) {
              try {
                const parsedPrice = parsePrice(priceMatch[0]);
                if (parsedPrice > 0) {
                  price = parsedPrice;
                  break;
                }
              } catch (error) {
                this.logger.debug(`Failed to parse price: ${priceMatch[0]}`);
              }
            }
          }
        }
        if (price !== null) break;
      }

      // Titolo
      const title =
        $('[itemprop="name"]').first().text().trim() ||
        $('h1').first().text().trim() ||
        $('title').text().trim() ||
        '';

      // Immagine
      const imageUrl =
        $('[itemprop="image"]').attr('src') ||
        $('img.product-image').attr('src') ||
        $('img[class*="product"]').first().attr('src') ||
        '';

      if (price === null) {
        throw new Error('Price not found on page');
      }

      return {
        price,
        currency: Currency.EUR,
        isAvailable: true, // Assume available if we found a price
        title,
        imageUrl,
      };
    } catch (error) {
      this.logger.error(`Error scraping generic page: ${error.message}`);
      throw new Error(`Failed to scrape product: ${error.message}`);
    }
  }
}

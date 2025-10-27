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
export class EbayScraper implements Scraper {
  private readonly logger = new Logger(EbayScraper.name);

  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Match ebay.* domains (ebay.it, ebay.com, ebay.co.uk, etc.)
      // but not fake domains like febay.it or ebay-fake.com
      return /^(www\.)?ebay\.[a-z.]+$/i.test(urlObj.hostname);
    } catch {
      return false;
    }
  }

  getStoreName(): string {
    return 'eBay';
  }

  async scrape(url: string): Promise<ScraperResult> {
    try {
      this.logger.log(`Scraping eBay product: ${url}`);

      const { data } = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(data);

      // Estrai prezzo e valuta
      let price: number | null = null;
      let currency: Currency = Currency.EUR; // default fallback
      const priceSelectors = [
        '.x-price-primary .ux-textspans',
        '[itemprop="price"]',
        '.mainPrice',
        '.notranslate',
      ];

      for (const selector of priceSelectors) {
        const priceText = $(selector).first().text().trim();
        if (priceText) {
          // Estrai valuta dal testo del prezzo
          if (priceText.includes('€') || priceText.includes('EUR')) {
            currency = Currency.EUR;
          } else if (priceText.includes('$') || priceText.includes('USD')) {
            currency = Currency.USD;
          } else if (priceText.includes('£') || priceText.includes('GBP')) {
            currency = Currency.GBP;
          } else if (priceText.includes('CHF')) {
            currency = Currency.CHF;
          }

          const priceMatch = priceText.match(/[\d.,]+/);
          if (priceMatch) {
            try {
              price = parsePrice(priceMatch[0]);
              break;
            } catch (error) {
              this.logger.debug(`Failed to parse price: ${priceMatch[0]}`);
            }
          }
        }
      }

      // Titolo
      const title =
        $('h1.x-item-title__mainTitle').text().trim() ||
        $('.it-ttl').text().trim() ||
        '';

      // Immagine
      const imageUrl =
        $('img.ux-image-magnify__image--original').attr('src') ||
        $('#icImg').attr('src') ||
        '';

      // Item number (SKU)
      const itemNumberText = $('.ux-labels-values__values-content')
        .text()
        .trim();
      const sku = itemNumberText || undefined;

      // Disponibilità
      const availability = $('.ux-action').text().toLowerCase();
      const isAvailable =
        !availability.includes('sold') &&
        !availability.includes('non disponibile') &&
        price !== null;

      if (price === null) {
        throw new Error('Price not found on eBay page');
      }

      return {
        price,
        currency,
        isAvailable,
        title,
        imageUrl,
        sku,
      };
    } catch (error) {
      this.logger.error(`Error scraping eBay: ${error.message}`);
      throw new Error(`Failed to scrape eBay product: ${error.message}`);
    }
  }
}

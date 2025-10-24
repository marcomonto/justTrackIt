import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Scraper, ScraperResult } from '../interfaces/scraper.interface';

@Injectable()
export class EbayScraper implements Scraper {
  private readonly logger = new Logger(EbayScraper.name);

  canHandle(url: string): boolean {
    return url.includes('ebay.');
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

      // Estrai prezzo
      let price: number | null = null;
      const priceSelectors = [
        '.x-price-primary .ux-textspans',
        '[itemprop="price"]',
        '.mainPrice',
        '.notranslate',
      ];

      for (const selector of priceSelectors) {
        const priceText = $(selector).first().text().trim();
        if (priceText) {
          const priceMatch = priceText.match(/[\d.,]+/);
          if (priceMatch) {
            price = parseFloat(priceMatch[0].replace(',', '.'));
            if (!isNaN(price)) {
              break;
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
        currency: 'EUR',
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

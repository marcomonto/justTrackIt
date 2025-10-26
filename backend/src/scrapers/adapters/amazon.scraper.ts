import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  Scraper,
  ScraperResult,
  Currency,
} from '../interfaces/scraper.interface';

@Injectable()
export class AmazonScraper implements Scraper {
  private readonly logger = new Logger(AmazonScraper.name);
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];

  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Match amazon.* domains (amazon.it, amazon.com, amazon.co.uk, etc.)
      // but not fake domains like famazon.it or amazon-fake.com
      return /^(www\.)?amazon\.[a-z.]+$/i.test(urlObj.hostname);
    } catch {
      return false;
    }
  }

  getStoreName(): string {
    return 'Amazon';
  }

  async scrape(url: string): Promise<ScraperResult> {
    try {
      this.logger.log(`Scraping Amazon product: ${url}`);

      const randomUserAgent =
        this.userAgents[Math.floor(Math.random() * this.userAgents.length)];

      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': randomUserAgent,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(data);

      // Estrai prezzo e valuta (Amazon ha diversi selettori possibili)
      let price: number | null = null;
      let currency: Currency = Currency.EUR; // default fallback
      const priceSelectors = [
        '.a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-price-whole',
        '#corePrice_feature_div .a-offscreen',
      ];

      for (const selector of priceSelectors) {
        const priceText = $(selector).first().text().trim();
        if (priceText) {
          // Estrai valuta dal testo del prezzo
          if (priceText.includes('€')) {
            currency = Currency.EUR;
          } else if (priceText.includes('$')) {
            currency = Currency.USD;
          } else if (priceText.includes('£')) {
            currency = Currency.GBP;
          } else if (priceText.includes('CHF')) {
            currency = Currency.CHF;
          }

          // Rimuovi simboli di valuta e converti
          const priceMatch = priceText.match(/[\d.,]+/);
          if (priceMatch) {
            price = parseFloat(priceMatch[0].replace(',', '.'));
            if (!isNaN(price)) {
              break;
            }
          }
        }
      }

      // Titolo prodotto
      const title =
        $('#productTitle').text().trim() ||
        $('h1.a-size-large').text().trim() ||
        '';

      // Immagine
      const imageUrl =
        $('#landingImage').attr('src') ||
        $('#imgBlkFront').attr('src') ||
        $('.a-dynamic-image').first().attr('src') ||
        '';

      // ASIN (SKU Amazon)
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
      const sku = asinMatch ? asinMatch[1] : undefined;

      // Disponibilità
      const availability = $('#availability').text().toLowerCase();
      const isAvailable =
        !availability.includes('non disponibile') &&
        !availability.includes('currently unavailable') &&
        price !== null;

      if (price === null) {
        throw new Error('Price not found on Amazon page');
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
      this.logger.error(`Error scraping Amazon: ${error.message}`);
      throw new Error(`Failed to scrape Amazon product: ${error.message}`);
    }
  }
}

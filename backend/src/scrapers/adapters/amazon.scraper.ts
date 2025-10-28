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

  private getAcceptLanguage(url: string): string {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();

      // Map domains to their respective Accept-Language headers
      if (domain.includes('amazon.it')) {
        return 'it-IT,it;q=0.9,en;q=0.8';
      } else if (domain.includes('amazon.com')) {
        return 'en-US,en;q=0.9';
      } else if (domain.includes('amazon.co.uk')) {
        return 'en-GB,en;q=0.9';
      } else if (domain.includes('amazon.de')) {
        return 'de-DE,de;q=0.9,en;q=0.8';
      } else if (domain.includes('amazon.fr')) {
        return 'fr-FR,fr;q=0.9,en;q=0.8';
      } else if (domain.includes('amazon.es')) {
        return 'es-ES,es;q=0.9,en;q=0.8';
      } else if (domain.includes('amazon.ca')) {
        return 'en-CA,en;q=0.9,fr;q=0.8';
      } else if (domain.includes('amazon.co.jp')) {
        return 'ja-JP,ja;q=0.9,en;q=0.8';
      }

      // Default fallback to en-US
      return 'en-US,en;q=0.9';
    } catch {
      return 'en-US,en;q=0.9';
    }
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
          'Accept-Language': this.getAcceptLanguage(url),
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
        '.a-price[data-a-color="price"] .a-offscreen',
        'span.a-price-whole',
        '.priceToPay .a-offscreen',
        '#corePriceDisplay_desktop_feature_div .a-offscreen',
        '.apexPriceToPay .a-offscreen',
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
            try {
              price = parsePrice(priceMatch[0]);
              break;
            } catch (error) {
              this.logger.debug(`Failed to parse price: ${priceMatch[0]}`);
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

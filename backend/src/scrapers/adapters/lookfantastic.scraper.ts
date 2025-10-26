import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  Scraper,
  ScraperResult,
  Currency,
} from '../interfaces/scraper.interface';

@Injectable()
export class LookfantasticScraper implements Scraper {
  private readonly logger = new Logger(LookfantasticScraper.name);

  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Match lookfantastic.* domains (lookfantastic.it, lookfantastic.com, etc.)
      return /^(www\.)?lookfantastic\.[a-z.]+$/i.test(urlObj.hostname);
    } catch {
      return false;
    }
  }

  getStoreName(): string {
    return 'Lookfantastic';
  }

  async scrape(url: string): Promise<ScraperResult> {
    try {
      this.logger.log(`Scraping Lookfantastic product: ${url}`);

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

      // Lookfantastic uses JSON-LD structured data
      let price: number | null = null;
      let currency: Currency = Currency.EUR;
      let title = '';
      let imageUrl = '';
      let isAvailable = false;
      let sku: string | undefined;

      // Try to extract from JSON-LD structured data
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const jsonText = $(element).html();
          if (jsonText) {
            const jsonData = JSON.parse(jsonText);

            // Handle both single object and array of objects
            const products = Array.isArray(jsonData) ? jsonData : [jsonData];

            for (const item of products) {
              if (item['@type'] === 'Product') {
                // Extract title
                if (item.name) {
                  title = item.name;
                }

                // Extract SKU
                if (item.sku) {
                  sku = item.sku;
                }

                // Extract image
                if (item.image) {
                  imageUrl = Array.isArray(item.image)
                    ? item.image[0]
                    : item.image;
                }

                // Extract price and availability from offers
                if (item.offers) {
                  const offer = Array.isArray(item.offers)
                    ? item.offers[0]
                    : item.offers;

                  if (offer.price) {
                    price = parseFloat(offer.price);
                  }

                  if (offer.priceCurrency) {
                    // Map currency code to enum
                    const currencyCode = offer.priceCurrency.toUpperCase();
                    if (currencyCode in Currency) {
                      currency = Currency[currencyCode as keyof typeof Currency];
                    }
                  }

                  // Check availability
                  if (offer.availability) {
                    isAvailable =
                      offer.availability.includes('InStock') ||
                      offer.availability === 'https://schema.org/InStock';
                  }
                }
              }
            }
          }
        } catch (parseError) {
          // Skip invalid JSON
          this.logger.debug(`Failed to parse JSON-LD: ${parseError}`);
        }
      });

      // Fallback: try to extract from HTML if JSON-LD failed
      if (price === null) {
        // Try common price selectors
        const priceSelectors = [
          '[data-price-value]',
          '.productPrice_price',
          '[itemprop="price"]',
          '.price',
        ];

        for (const selector of priceSelectors) {
          const priceElement = $(selector).first();
          const priceText =
            priceElement.attr('data-price-value') ||
            priceElement.attr('content') ||
            priceElement.text().trim();

          if (priceText) {
            // Extract currency from text
            if (priceText.includes('€')) {
              currency = Currency.EUR;
            } else if (priceText.includes('$')) {
              currency = Currency.USD;
            } else if (priceText.includes('£')) {
              currency = Currency.GBP;
            }

            const priceMatch = priceText.match(/[\d.,]+/);
            if (priceMatch) {
              price = parseFloat(priceMatch[0].replace(',', '.'));
              if (!isNaN(price)) {
                break;
              }
            }
          }
        }
      }

      // Fallback: extract title from h1 if not found
      if (!title) {
        title = $('h1').first().text().trim() || '';
      }

      // Fallback: extract image if not found
      if (!imageUrl) {
        imageUrl =
          $('.carouselImages img').first().attr('src') ||
          $('[itemprop="image"]').attr('src') ||
          '';
      }

      // Extract SKU from URL if not found (/p/product-name/SKU/)
      if (!sku) {
        const skuMatch = url.match(/\/(\d+)\/?$/);
        if (skuMatch) {
          sku = skuMatch[1];
        }
      }

      if (price === null) {
        throw new Error('Price not found on Lookfantastic page');
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
      this.logger.error(`Error scraping Lookfantastic: ${error.message}`);
      throw new Error(
        `Failed to scrape Lookfantastic product: ${error.message}`,
      );
    }
  }
}

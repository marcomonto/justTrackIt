import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  Scraper,
  ScraperResult,
  Currency,
} from '../interfaces/scraper.interface';

@Injectable()
export class SephoraScraper implements Scraper {
  private readonly logger = new Logger(SephoraScraper.name);

  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Match sephora.* domains (sephora.it, sephora.com, sephora.fr, etc.)
      return /^(www\.)?sephora\.[a-z.]+$/i.test(urlObj.hostname);
    } catch {
      return false;
    }
  }

  getStoreName(): string {
    return 'Sephora';
  }

  async scrape(url: string): Promise<ScraperResult> {
    try {
      this.logger.log(`Scraping Sephora product: ${url}`);

      const { data } = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(data);

      // Sephora uses JSON-LD structured data
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
          this.logger.debug(`Failed to parse JSON-LD: ${parseError}`);
        }
      });

      // Fallback: try to extract from HTML if JSON-LD failed
      if (price === null) {
        // Try Sephora-specific selectors
        const priceSelectors = [
          '[data-at="price"]',
          '.css-n4x4dy', // Sephora's price class
          '[class*="Price"]',
          '[itemprop="price"]',
          '.product-price',
        ];

        for (const selector of priceSelectors) {
          const priceElement = $(selector).first();
          const priceText =
            priceElement.attr('content') ||
            priceElement.text().trim() ||
            priceElement.attr('data-price');

          if (priceText) {
            // Extract currency from text
            if (priceText.includes('€')) {
              currency = Currency.EUR;
            } else if (priceText.includes('$')) {
              currency = Currency.USD;
            } else if (priceText.includes('£')) {
              currency = Currency.GBP;
            } else if (priceText.includes('CHF')) {
              currency = Currency.CHF;
            }

            // Extract numeric price
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

      // Fallback: extract title from h1 or meta tags
      if (!title) {
        title =
          $('[data-at="product_name"]').first().text().trim() ||
          $('h1[class*="product"]').first().text().trim() ||
          $('h1').first().text().trim() ||
          $('meta[property="og:title"]').attr('content') ||
          '';
      }

      // Fallback: extract image
      if (!imageUrl) {
        imageUrl =
          $('meta[property="og:image"]').attr('content') ||
          $('[itemprop="image"]').attr('src') ||
          $('img[class*="product"]').first().attr('src') ||
          '';
      }

      // Extract SKU from URL or page
      // Sephora URLs typically: /p/product-name-sku.html or /p/product-name/P123456
      if (!sku) {
        const skuMatch = url.match(/[P]?(\d{6,})/i);
        if (skuMatch) {
          sku = skuMatch[0];
        }
      }

      // Check availability from page
      if (!isAvailable) {
        const pageHtml = $.html().toLowerCase();
        const addToCartButton = $('[data-at="add_to_basket"]').length > 0;
        isAvailable =
          addToCartButton &&
          !pageHtml.includes('out of stock') &&
          !pageHtml.includes('esaurito') &&
          !pageHtml.includes('non disponibile') &&
          price !== null;
      }

      if (price === null) {
        throw new Error('Price not found on Sephora page');
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
      this.logger.error(`Error scraping Sephora: ${error.message}`);
      throw new Error(`Failed to scrape Sephora product: ${error.message}`);
    }
  }
}

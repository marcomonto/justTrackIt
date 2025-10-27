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
export class VeralabScraper implements Scraper {
  private readonly logger = new Logger(VeralabScraper.name);

  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Match veralab.it domain
      return /^(www\.)?veralab\.it$/i.test(urlObj.hostname);
    } catch {
      return false;
    }
  }

  getStoreName(): string {
    return 'Veralab';
  }

  async scrape(url: string): Promise<ScraperResult> {
    try {
      this.logger.log(`Scraping Veralab product: ${url}`);

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
        },
        timeout: 15000,
      });

      const $ = cheerio.load(data);

      let price: number | null = null;
      let currency: Currency = Currency.EUR;
      let title = '';
      let imageUrl = '';
      let isAvailable = false;
      let sku: string | undefined;

      // Try to extract from JSON-LD structured data (Shopify standard)
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const jsonText = $(element).html();
          if (jsonText) {
            const jsonData = JSON.parse(jsonText);

            const products = Array.isArray(jsonData) ? jsonData : [jsonData];

            for (const item of products) {
              if (item['@type'] === 'Product') {
                if (item.name) {
                  title = item.name;
                }

                if (item.sku) {
                  sku = item.sku;
                }

                if (item.image) {
                  imageUrl = Array.isArray(item.image)
                    ? item.image[0]
                    : item.image;
                }

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

      // Fallback: try Shopify-specific and Remix selectors
      if (price === null) {
        const priceSelectors = [
          '.price-item--regular',
          '.price__regular .price-item',
          '[data-product-price]',
          '.product__price',
          '.price',
          '[itemprop="price"]',
          'span[class*="price"]',
          'div[class*="price"]',
          'p[class*="price"]',
        ];

        for (const selector of priceSelectors) {
          const priceElement = $(selector).first();
          const priceText =
            priceElement.attr('content') ||
            priceElement.attr('data-product-price') ||
            priceElement.text().trim();

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
              try {
                price = parsePrice(priceMatch[0]);
                break;
              } catch (error) {
                this.logger.debug(`Failed to parse price: ${priceMatch[0]}`);
              }
            }
          }
        }

        // Last resort: search for price pattern in entire page text
        if (price === null) {
          const bodyText = $('body').text();
          // Look for patterns like "26,00€" or "26.00€"
          const pricePattern = /(\d+[.,]\d{2})\s*€/;
          const match = bodyText.match(pricePattern);
          if (match) {
            try {
              price = parsePrice(match[1]);
              currency = Currency.EUR;
              this.logger.log(`Found price via text search: ${price}`);
            } catch (error) {
              this.logger.debug(`Failed to parse price from text: ${match[1]}`);
            }
          }
        }
      }

      // Fallback: extract title
      if (!title) {
        title =
          $('.product__title').first().text().trim() ||
          $('h1.product-title').first().text().trim() ||
          $('h1').first().text().trim() ||
          $('meta[property="og:title"]').attr('content') ||
          $('title').text().trim() ||
          '';
      }

      // Fallback: extract image
      if (!imageUrl) {
        imageUrl =
          $('meta[property="og:image"]').attr('content') ||
          $('.product__media img').first().attr('src') ||
          $('[itemprop="image"]').attr('src') ||
          $('.product-image img').first().attr('src') ||
          '';
      }

      // Extract SKU from URL (Shopify product ID)
      if (!sku) {
        const skuMatch = url.match(/\/prodotti\/(\d+)\//);
        if (skuMatch) {
          sku = skuMatch[1];
        }
      }

      // Check availability (Shopify specific)
      if (!isAvailable) {
        const addToCartButton = $('button[name="add"]').length > 0 ||
          $('.product-form__submit').length > 0 ||
          $('[data-add-to-cart]').length > 0;

        const soldOutIndicator = $('.sold-out').length > 0 ||
          $('.product-form--sold-out').length > 0;

        isAvailable = addToCartButton && !soldOutIndicator && price !== null;
      }

      if (price === null) {
        throw new Error('Price not found on Veralab page');
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
      this.logger.error(`Error scraping Veralab: ${error.message}`);
      throw new Error(`Failed to scrape Veralab product: ${error.message}`);
    }
  }
}

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
export class PinalliScraper implements Scraper {
  private readonly logger = new Logger(PinalliScraper.name);

  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Match pinalli.it domain
      return /^(www\.)?pinalli\.it$/i.test(urlObj.hostname);
    } catch {
      return false;
    }
  }

  getStoreName(): string {
    return 'Pinalli';
  }

  async scrape(url: string): Promise<ScraperResult> {
    try {
      this.logger.log(`Scraping Pinalli product: ${url}`);

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

      // Try to extract from JSON-LD structured data
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
                    try {
                      price = parsePrice(String(offer.price));
                    } catch (error) {
                      this.logger.debug(`Failed to parse price from JSON-LD: ${offer.price}`);
                    }
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

      // Fallback: try to extract from HTML
      if (price === null) {
        const priceSelectors = [
          '[data-testid="price"]',
          '.product-price',
          '.price',
          '[class*="price"]',
          '[itemprop="price"]',
          '.product-info-price',
          '.price-wrapper',
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
              try {
                price = parsePrice(priceMatch[0]);
                break;
              } catch (error) {
                this.logger.debug(`Failed to parse price: ${priceMatch[0]}`);
              }
            }
          }
        }
      }

      // Fallback: extract title
      if (!title) {
        title =
          $('h1.product-name').first().text().trim() ||
          $('h1[class*="product"]').first().text().trim() ||
          $('h1').first().text().trim() ||
          $('meta[property="og:title"]').attr('content') ||
          $('title').text().trim() ||
          '';
      }

      // Fallback: extract image
      if (!imageUrl) {
        imageUrl =
          $('meta[property="og:image"]').attr('content') ||
          $('[itemprop="image"]').attr('src') ||
          $('.product-image img').first().attr('src') ||
          $('img[class*="product"]').first().attr('src') ||
          '';
      }

      // Extract SKU from URL or page
      if (!sku) {
        const skuMatch =
          url.match(/\/([A-Z0-9]{6,})/i) || url.match(/\/(\d{4,})/);
        if (skuMatch) {
          sku = skuMatch[1];
        } else {
          // Try to find SKU in page
          const skuText =
            $('[class*="sku"]').text().trim() ||
            $('[data-sku]').attr('data-sku') ||
            '';
          if (skuText) {
            const skuExtract = skuText.match(/[A-Z0-9]{4,}/i);
            if (skuExtract) {
              sku = skuExtract[0];
            }
          }
        }
      }

      // Check availability
      if (!isAvailable) {
        const pageHtml = $.html().toLowerCase();
        const addToCartButton =
          $('button[class*="add-to-cart"]').length > 0 ||
          $('button[class*="aggiungi"]').length > 0 ||
          $('.add-to-basket').length > 0;

        isAvailable =
          addToCartButton &&
          !pageHtml.includes('out of stock') &&
          !pageHtml.includes('esaurito') &&
          !pageHtml.includes('non disponibile') &&
          !pageHtml.includes('sold out') &&
          price !== null;
      }

      if (price === null) {
        throw new Error('Price not found on Pinalli page');
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
      this.logger.error(`Error scraping Pinalli: ${error.message}`);
      throw new Error(`Failed to scrape Pinalli product: ${error.message}`);
    }
  }
}

import { Module } from '@nestjs/common';
import { ScrapersService } from './scrapers.service';
import { ScraperFactory } from './scraper.factory';
import { AmazonScraper } from './adapters/amazon.scraper';
import { EbayScraper } from './adapters/ebay.scraper';
import { LookfantasticScraper } from './adapters/lookfantastic.scraper';
import { ZalandoScraper } from './adapters/zalando.scraper';
import { SephoraScraper } from './adapters/sephora.scraper';
import { GenericScraper } from './adapters/generic.scraper';

@Module({
  providers: [
    ScrapersService,
    ScraperFactory,
    AmazonScraper,
    EbayScraper,
    LookfantasticScraper,
    ZalandoScraper,
    SephoraScraper,
    GenericScraper,
  ],
  exports: [ScrapersService],
})
export class ScrapersModule {}

import { Module } from '@nestjs/common';
import { ScrapersService } from './scrapers.service';
import { AmazonScraper } from './adapters/amazon.scraper';
import { EbayScraper } from './adapters/ebay.scraper';
import { GenericScraper } from './adapters/generic.scraper';

@Module({
  providers: [
    ScrapersService,
    AmazonScraper,
    EbayScraper,
    GenericScraper,
  ],
  exports: [ScrapersService],
})
export class ScrapersModule {}

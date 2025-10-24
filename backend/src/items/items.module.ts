import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { TrackedItem } from '../entities/tracked-item.entity';
import { PriceHistory } from '../entities/price-history.entity';
import { ScrapersModule } from '../scrapers/scrapers.module';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrackedItem, PriceHistory]),
    ScrapersModule,
    StoresModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}

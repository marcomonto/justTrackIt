import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { TrackedItem } from '../entities/tracked-item.entity';
import { PriceHistory } from '../entities/price-history.entity';
import { PriceAlert } from '../entities/price-alert.entity';
import { Notification } from '../entities/notification.entity';
import { ScrapersModule } from '../scrapers/scrapers.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([TrackedItem, PriceHistory, PriceAlert, Notification]),
    ScrapersModule,
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}

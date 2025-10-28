import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { TrackedItem } from '../items/entities/tracked-item.entity';
import { UserTrackedItem } from '../items/entities/user-tracked-item.entity';
import { PriceHistory } from '../items/entities/price-history.entity';
import { PriceAlert } from '../alerts/entities/price-alert.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { ScrapersModule } from '../scrapers/scrapers.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([TrackedItem, UserTrackedItem, PriceHistory, PriceAlert, Notification]),
    ScrapersModule,
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}

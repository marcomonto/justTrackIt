import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { PriceAlert } from './entities/price-alert.entity';
import { TrackedItem } from '../items/entities/tracked-item.entity';
import { UserTrackedItem } from '../items/entities/user-tracked-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PriceAlert, TrackedItem, UserTrackedItem])],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ItemsModule } from './items/items.module';
import { StoresModule } from './stores/stores.module';
import { ScrapersModule } from './scrapers/scrapers.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AlertsModule } from './alerts/alerts.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'justtrack it.db',
      autoLoadEntities: true,
      synchronize: true, // Auto-sync schema (solo in dev)
      logging: false,
    }),
    AuthModule,
    ItemsModule,
    StoresModule,
    ScrapersModule,
    SchedulerModule,
    AlertsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

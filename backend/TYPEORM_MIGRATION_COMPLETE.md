# Migrazione TypeORM - Istruzioni Finali

## ✅ Moduli Completati

1. AuthModule ✅
2. StoresModule ✅
3. AlertsModule ✅

## ⚠️ Moduli Rimanenti da Completare Manualmente

Segui esattamente questo pattern per i moduli rimanenti:

### NotificationsService

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { PriceAlert } from '../entities/price-alert.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PriceAlert)
    private alertRepository: Repository<PriceAlert>,
    private mailerService: MailerService,
  ) {}

  async processPendingNotifications() {
    const pending = await this.notificationRepository.find({
      where: { status: 'pending', channel: 'email' },
      relations: ['user', 'alert', 'alert.item', 'alert.item.store'],
      take: 50,
    });

    for (const notification of pending) {
      try {
        await this.sendEmailNotification(notification);
        notification.status = 'sent';
        notification.sentAt = new Date();
        await this.notificationRepository.save(notification);
      } catch (error) {
        notification.status = 'failed';
        await this.notificationRepository.save(notification);
      }
    }
  }

  async findAll(userId: number, limit = 50) {
    return this.notificationRepository.find({
      where: { userId },
      relations: ['alert', 'alert.item'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ... rest of methods
}
```

### NotificationsModule

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { PriceAlert } from '../entities/price-alert.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, PriceAlert]),
    MailerModule.forRoot({...}),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

### ItemsService

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackedItem } from '../entities/tracked-item.entity';
import { PriceHistory } from '../entities/price-history.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(TrackedItem)
    private trackedItemRepository: Repository<TrackedItem>,
    @InjectRepository(PriceHistory)
    private priceHistoryRepository: Repository<PriceHistory>,
    private scrapersService: ScrapersService,
    private storesService: StoresService,
  ) {}

  async createTrackedItem(dto: CreateTrackedItemDto, userId: number) {
    const store = await this.storesService.getStoreFromUrl(dto.productUrl);
    const scrapedData = await this.scrapersService.scrapeProduct(dto.productUrl);

    const item = this.trackedItemRepository.create({
      userId,
      storeId: store.id,
      name: scrapedData.title || 'Unknown Product',
      currentPrice: scrapedData.price,
      currency: scrapedData.currency,
      targetPrice: dto.targetPrice,
      productUrl: dto.productUrl,
      isTracking: true,
      status: 'tracking',
      lastCheckedAt: new Date(),
    });

    const saved = await this.trackedItemRepository.save(item);

    await this.priceHistoryRepository.save({
      itemId: saved.id,
      price: scrapedData.price,
      currency: scrapedData.currency,
      isAvailable: scrapedData.isAvailable,
    });

    return saved;
  }

  async findAllTrackedItems(userId: number) {
    return this.trackedItemRepository.find({
      where: { userId },
      relations: ['store'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneTrackedItem(id: number, userId: number) {
    const item = await this.trackedItemRepository.findOne({
      where: { id },
      relations: ['store', 'priceHistory', 'alerts'],
    });

    if (!item || item.userId !== userId) {
      throw new NotFoundException();
    }

    return item;
  }

  async refreshPrice(id: number, userId: number) {
    const item = await this.findOneTrackedItem(id, userId);
    const scrapedData = await this.scrapersService.scrapeProduct(item.productUrl);

    item.updatePrice(scrapedData.price, scrapedData.currency);
    await this.trackedItemRepository.save(item);

    await this.priceHistoryRepository.save({
      itemId: id,
      price: scrapedData.price,
      currency: scrapedData.currency,
      isAvailable: scrapedData.isAvailable,
    });

    return item;
  }

  // Usa i metodi dell'entity:
  async pauseTracking(id: number, userId: number) {
    const item = await this.findOneTrackedItem(id, userId);
    item.pauseTracking(); // Business logic nell'entity!
    return this.trackedItemRepository.save(item);
  }

  // ...rest
}
```

### ItemsModule

```typescript
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
```

### SchedulerService

```typescript
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackedItem } from '../entities/tracked-item.entity';
import { PriceHistory } from '../entities/price-history.entity';
import { PriceAlert } from '../entities/price-alert.entity';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class SchedulerService {
  constructor(
    @InjectRepository(TrackedItem)
    private trackedItemRepository: Repository<TrackedItem>,
    @InjectRepository(PriceHistory)
    private priceHistoryRepository: Repository<PriceHistory>,
    @InjectRepository(PriceAlert)
    private alertRepository: Repository<PriceAlert>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private scrapersService: ScrapersService,
  ) {}

  @Cron('0 */6 * * *')
  async checkAllPrices() {
    const items = await this.trackedItemRepository.find({
      where: { isTracking: true, status: 'tracking' },
      relations: ['store'],
    });

    for (const item of items) {
      try {
        await this.checkItemPrice(item.id);
      } catch (error) {
        console.error(`Error checking item ${item.id}:`, error);
      }
    }
  }

  async checkItemPrice(itemId: number) {
    const item = await this.trackedItemRepository.findOne({
      where: { id: itemId },
    });

    const scrapedData = await this.scrapersService.scrapeProduct(item.productUrl);

    const oldPrice = item.currentPrice;
    const newPrice = scrapedData.price;

    item.updatePrice(newPrice, scrapedData.currency);
    await this.trackedItemRepository.save(item);

    await this.priceHistoryRepository.save({
      itemId,
      price: newPrice,
      currency: scrapedData.currency,
      isAvailable: scrapedData.isAvailable,
    });

    if (oldPrice && newPrice < oldPrice) {
      await this.checkPriceAlerts(itemId, oldPrice, newPrice);
    }
  }

  private async checkPriceAlerts(itemId: number, oldPrice: number, newPrice: number) {
    const alerts = await this.alertRepository.find({
      where: { itemId, isActive: true },
      relations: ['user', 'item'],
    });

    for (const alert of alerts) {
      let shouldTrigger = false;

      if (alert.type === 'target_reached' && alert.triggerPrice >= newPrice) {
        shouldTrigger = true;
      } else if (alert.type === 'price_drop' && newPrice < oldPrice) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        await this.notificationRepository.save({
          userId: alert.userId,
          alertId: alert.id,
          type: alert.type,
          channel: 'email',
          title: 'Price Alert',
          message: `Price dropped from ${oldPrice} to ${newPrice}`,
          data: JSON.stringify({ itemId, oldPrice, newPrice }),
        });

        alert.lastTriggeredAt = new Date();
        await this.alertRepository.save(alert);
      }
    }
  }
}
```

### SchedulerModule

```typescript
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
```

## 🗑️ File da Rimuovere

Dopo aver completato tutti i moduli:

```bash
rm src/prisma.service.ts
rm src/prisma.module.ts
rm -rf prisma/
npm uninstall @prisma/client prisma
```

## ✅ Test Finale

```bash
npm run build
npm run start:dev
```

Verifica che tutti i moduli funzionino correttamente.

## 🎯 Vantaggi ottenuti

- ✅ Entity con business logic integrata
- ✅ No doppio layer (Prisma types + Domain entities)
- ✅ Repository pattern nativo NestJS
- ✅ Decoratori TypeORM chiari e dichiarativi
- ✅ Supporto ufficiale NestJS

Segui questi pattern per completare la migrazione!

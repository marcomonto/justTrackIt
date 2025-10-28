import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrackedItem } from '../items/entities/tracked-item.entity';
import { UserTrackedItem } from '../items/entities/user-tracked-item.entity';
import { PriceHistory } from '../items/entities/price-history.entity';
import { PriceAlert } from '../alerts/entities/price-alert.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { ScrapersService } from '../scrapers/scrapers.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(TrackedItem)
    private trackedItemRepository: Repository<TrackedItem>,
    @InjectRepository(UserTrackedItem)
    private userTrackedItemRepository: Repository<UserTrackedItem>,
    @InjectRepository(PriceHistory)
    private priceHistoryRepository: Repository<PriceHistory>,
    @InjectRepository(PriceAlert)
    private alertRepository: Repository<PriceAlert>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private scrapersService: ScrapersService,
  ) {}

  // Esegue ogni 6 ore
  @Cron(CronExpression.EVERY_6_HOURS)
  async checkAllPrices() {
    this.logger.log('Starting scheduled price check...');

    try {
      // Get all TrackedItems that have at least one active UserTrackedItem
      // This avoids scraping products that no one is actively tracking
      const items = await this.trackedItemRepository
        .createQueryBuilder('item')
        .innerJoin('item.userTrackedItems', 'userItem')
        .leftJoinAndSelect('item.store', 'store')
        .where('userItem.isTracking = :isTracking', { isTracking: true })
        .andWhere('userItem.status = :status', { status: 'tracking' })
        .groupBy('item.id')
        .addGroupBy('store.id')
        .getMany();

      this.logger.log(`Found ${items.length} unique items to check (potentially tracked by multiple users)`);

      let successCount = 0;
      let errorCount = 0;

      // Check prices sequentially to respect rate limiting
      for (const item of items) {
        try {
          await this.checkItemPrice(item.id);
          successCount++;

          // Add delay to avoid rate limiting (1 second between requests)
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Failed to check price for item ${item.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Price check completed: ${successCount} success, ${errorCount} errors`,
      );
    } catch (error) {
      this.logger.error(`Error in scheduled price check: ${error.message}`);
    }
  }

  async checkItemPrice(itemId: string) {
    const item = await this.trackedItemRepository.findOne({
      where: { id: itemId },
      relations: ['store'],
    });

    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }

    this.logger.log(`Checking price for item ${itemId}: ${item.name}`);

    try {
      // Scrape current price
      const scrapedData =
        await this.scrapersService.scrapeProduct(item.productUrl);

      const oldPrice = item.currentPrice;
      const newPrice = scrapedData.price;

      // Update item using entity business logic
      item.updatePrice(newPrice, scrapedData.currency, scrapedData.isAvailable);
      await this.trackedItemRepository.save(item);

      // Add to price history
      await this.priceHistoryRepository.save(
        this.priceHistoryRepository.create({
          itemId: itemId,
          price: newPrice,
          currency: scrapedData.currency,
          isAvailable: scrapedData.isAvailable,
        }),
      );

      // Check if price changed
      if (oldPrice && newPrice < oldPrice) {
        const decrease = oldPrice - newPrice;
        const percentageDecrease = ((decrease / oldPrice) * 100).toFixed(2);
        this.logger.log(
          `Price drop detected for item ${itemId}: ${oldPrice} → ${newPrice} (-${percentageDecrease}%)`,
        );

        // Trigger price drop alert check (for PriceAlert entities)
        await this.checkPriceAlerts(itemId, oldPrice, newPrice);
      }

      // Check target prices for all users tracking this item
      await this.checkUserTargetPrices(itemId, item, newPrice);

      return { oldPrice, newPrice, changed: oldPrice !== newPrice };
    } catch (error) {
      this.logger.error(`Error checking price for item ${itemId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if the new price meets any user's target price
   */
  private async checkUserTargetPrices(
    itemId: string,
    item: TrackedItem,
    newPrice: number,
  ) {
    // Get all active UserTrackedItems for this product
    const userItems = await this.userTrackedItemRepository.find({
      where: {
        itemId: itemId,
        isTracking: true,
        status: 'tracking',
      },
      relations: ['user'],
    });

    for (const userItem of userItems) {
      // Check if user has a target price and it's been reached
      if (userItem.targetPrice && newPrice <= userItem.targetPrice) {
        this.logger.log(
          `Target price reached for user ${userItem.userId}: ${newPrice} <= ${userItem.targetPrice}`,
        );

        // Create notification for this user
        await this.notificationRepository.save(
          this.notificationRepository.create({
            userId: userItem.userId,
            type: 'target_reached',
            channel: 'email',
            title: 'Target Price Reached!',
            message: `${item.name} has reached your target price of ${userItem.targetPrice} ${item.currency}! Current price: ${newPrice} ${item.currency}`,
            data: JSON.stringify({
              itemId: itemId,
              itemName: item.name,
              targetPrice: userItem.targetPrice,
              currentPrice: newPrice,
              productUrl: item.productUrl,
            }),
          }),
        );
      }
    }
  }

  private async checkPriceAlerts(
    itemId: string,
    oldPrice: number,
    newPrice: number,
  ) {
    // Get active alerts for this item
    const alerts = await this.alertRepository.find({
      where: {
        itemId: itemId,
        isActive: true,
      },
      relations: ['user', 'item'],
    });

    for (const alert of alerts) {
      let shouldTrigger = false;

      switch (alert.type) {
        case 'target_reached':
          if (alert.triggerPrice && newPrice <= alert.triggerPrice) {
            shouldTrigger = true;
          }
          break;

        case 'price_drop':
          if (newPrice < oldPrice) {
            shouldTrigger = true;
          }
          break;

        case 'percentage_drop':
          if (alert.percentageDrop) {
            const decrease = ((oldPrice - newPrice) / oldPrice) * 100;
            if (decrease >= alert.percentageDrop) {
              shouldTrigger = true;
            }
          }
          break;

        case 'back_in_stock':
          // Would need to track previous availability
          break;
      }

      if (shouldTrigger) {
        await this.triggerAlert(alert, oldPrice, newPrice);
      }
    }
  }

  private async triggerAlert(alert: any, oldPrice: number, newPrice: number) {
    this.logger.log(`Triggering alert ${alert.id} for item ${alert.itemId}`);

    // Create notification
    const message = this.buildAlertMessage(alert, oldPrice, newPrice);

    await this.notificationRepository.save(
      this.notificationRepository.create({
        userId: alert.userId,
        alertId: alert.id,
        type: alert.type,
        channel: 'email',
        title: 'Price Alert',
        message: message,
        data: JSON.stringify({
          itemId: alert.itemId,
          itemName: alert.item.name,
          oldPrice,
          newPrice,
          productUrl: alert.item.productUrl,
        }),
      }),
    );

    // Update alert lastTriggeredAt
    alert.lastTriggeredAt = new Date();
    await this.alertRepository.save(alert);
  }

  private buildAlertMessage(
    alert: any,
    oldPrice: number,
    newPrice: number,
  ): string {
    const item = alert.item;
    const decrease = oldPrice - newPrice;
    const percentageDecrease = ((decrease / oldPrice) * 100).toFixed(2);

    switch (alert.type) {
      case 'target_reached':
        return `${item.name} has reached your target price of ${newPrice} ${item.currency}!`;

      case 'price_drop':
        return `${item.name} price dropped from ${oldPrice} to ${newPrice} ${item.currency} (-${percentageDecrease}%)`;

      case 'percentage_drop':
        return `${item.name} price dropped by ${percentageDecrease}%! Now ${newPrice} ${item.currency}`;

      default:
        return `Price alert for ${item.name}`;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { PriceAlert } from '../entities/price-alert.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PriceAlert)
    private alertRepository: Repository<PriceAlert>,
    private mailerService: MailerService,
  ) {}

  // Process pending notifications every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processPendingNotifications() {
    this.logger.log('Processing pending notifications...');

    const pendingNotifications = await this.notificationRepository.find({
      where: {
        status: 'pending',
        channel: 'email',
      },
      relations: ['user', 'alert', 'alert.item', 'alert.item.store'],
      take: 50, // Process in batches
    });

    this.logger.log(`Found ${pendingNotifications.length} pending notifications`);

    for (const notification of pendingNotifications) {
      try {
        await this.sendEmailNotification(notification);

        // Mark as sent
        notification.status = 'sent';
        notification.sentAt = new Date();
        await this.notificationRepository.save(notification);

        this.logger.log(`Notification ${notification.id} sent successfully`);
      } catch (error) {
        this.logger.error(
          `Failed to send notification ${notification.id}: ${error.message}`,
        );

        // Mark as failed
        notification.status = 'failed';
        await this.notificationRepository.save(notification);
      }
    }
  }

  private async sendEmailNotification(notification: any) {
    if (!notification.user.emailNotifications) {
      this.logger.log(
        `User ${notification.userId} has email notifications disabled`,
      );
      return;
    }

    const data = notification.data ? JSON.parse(notification.data) : {};

    await this.mailerService.sendMail({
      to: notification.user.email,
      subject: notification.title,
      template: this.getTemplate(notification.type),
      context: {
        userName: notification.user.name,
        message: notification.message,
        itemName: data.itemName,
        oldPrice: data.oldPrice,
        newPrice: data.newPrice,
        productUrl: data.productUrl,
        savings: data.oldPrice ? (data.oldPrice - data.newPrice).toFixed(2) : 0,
        percentageSaving: data.oldPrice
          ? (((data.oldPrice - data.newPrice) / data.oldPrice) * 100).toFixed(2)
          : 0,
      },
    });
  }

  private getTemplate(notificationType: string): string {
    switch (notificationType) {
      case 'price_drop':
      case 'target_reached':
      case 'percentage_drop':
        return 'price-alert';
      default:
        return 'generic';
    }
  }

  async findAll(userId: number, limit = 50) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['alert', 'alert.item'],
    });
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    // You could add a 'read' field to the schema if needed
    // For now, just return the notification
    return notification;
  }

  async getUnreadCount(userId: number) {
    return this.notificationRepository.count({
      where: {
        userId,
        // read: false, // If you add this field
      },
    });
  }
}

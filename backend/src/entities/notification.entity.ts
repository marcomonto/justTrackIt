import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { PriceAlert } from './price-alert.entity';

@Entity('notifications')
@Index(['userId', 'status'])
@Index(['status'])
export class Notification extends BaseEntity {
  @Column()
  userId: string;

  @Column({ nullable: true })
  alertId: string;

  @Column()
  type: string; // "price_drop", "target_reached", "error", "info"

  @Column({ default: 'email' })
  channel: string; // "email", "push", "webhook"

  @Column({ default: 'pending' })
  status: string; // "pending", "sent", "failed"

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  data: string; // JSON with extra data

  @Column({ type: 'datetime', nullable: true })
  sentAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => PriceAlert, (alert) => alert.notifications, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'alertId' })
  alert: PriceAlert;
}

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import { TrackedItem } from './tracked-item.entity';

/**
 * UserTrackedItem: Junction table with user-specific tracking data
 * Represents a user's personal tracking settings for a product
 */
@Entity('user_tracked_items')
@Unique(['userId', 'itemId'])
@Index(['userId', 'isTracking'])
export class UserTrackedItem extends BaseEntity {
  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  itemId: string;

  @Column({ type: 'real', nullable: true })
  targetPrice: number;

  @Column({ default: true })
  isTracking: boolean;

  @Column({ default: 'tracking' })
  status: string; // "tracking", "paused", "purchased", "wishlist", "to_buy"

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relations
  @ManyToOne(() => User, (user) => user.userTrackedItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => TrackedItem, (item) => item.userTrackedItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'itemId' })
  item: TrackedItem;

  // ==================== BUSINESS LOGIC ====================

  hasReachedTargetPrice(currentPrice: number): boolean {
    if (!currentPrice || !this.targetPrice) return false;
    return currentPrice <= this.targetPrice;
  }

  isActiveTracking(): boolean {
    return this.isTracking && this.status === 'tracking';
  }

  pauseTracking(): void {
    this.isTracking = false;
    this.status = 'paused';
  }

  resumeTracking(): void {
    this.isTracking = true;
    this.status = 'tracking';
  }

  markAsPurchased(): void {
    this.isTracking = false;
    this.status = 'purchased';
  }

  setStatus(status: string): void {
    this.status = status;
    // Auto-manage tracking flag based on status
    if (status === 'purchased' || status === 'paused') {
      this.isTracking = false;
    } else if (status === 'tracking') {
      this.isTracking = true;
    }
  }
}
import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import { Store } from '../../stores/entities/store.entity';
import { PriceHistory } from './price-history.entity';
import { PriceAlert } from '../../alerts/entities/price-alert.entity';

@Entity('tracked_items')
export class TrackedItem extends BaseEntity {
  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  storeId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column()
  productUrl: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ type: 'real', nullable: true })
  currentPrice: number;

  @Column({ default: 'EUR' })
  currency: string;

  @Column({ type: 'real', nullable: true })
  targetPrice: number;

  @Column({ default: true })
  @Index()
  isTracking: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastCheckedAt: Date;

  @Column({ nullable: true })
  category: string;

  @Column({ default: 'tracking' })
  status: string; // "tracking", "paused", "purchased"

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relations
  @ManyToOne(() => User, (user) => user.trackedItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Store, (store) => store.trackedItems)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @OneToMany(() => PriceHistory, (history) => history.item)
  priceHistory: PriceHistory[];

  @OneToMany(() => PriceAlert, (alert) => alert.item)
  alerts: PriceAlert[];

  // ==================== BUSINESS LOGIC ====================

  hasReachedTargetPrice(): boolean {
    if (!this.currentPrice || !this.targetPrice) return false;
    return this.currentPrice <= this.targetPrice;
  }

  calculateSavings(initialPrice: number): number {
    if (!this.currentPrice) return 0;
    return Math.max(0, initialPrice - this.currentPrice);
  }

  calculateDiscountPercentage(initialPrice: number): number {
    if (!this.currentPrice || initialPrice === 0) return 0;
    const savings = this.calculateSavings(initialPrice);
    return (savings / initialPrice) * 100;
  }

  isActiveTracking(): boolean {
    return this.isTracking && this.status === 'tracking';
  }

  updatePrice(newPrice: number, currency: string): void {
    this.currentPrice = newPrice;
    this.currency = currency;
    this.lastCheckedAt = new Date();
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

  getFormattedPrice(): string {
    if (!this.currentPrice) return 'N/A';
    return `${this.currentPrice.toFixed(2)} ${this.currency}`;
  }
}

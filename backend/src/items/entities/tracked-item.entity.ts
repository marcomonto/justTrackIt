import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Store } from '../../stores/entities/store.entity';
import { PriceHistory } from './price-history.entity';
import { UserTrackedItem } from './user-tracked-item.entity';

/**
 * TrackedItem: Represents a product that can be tracked by multiple users
 * This entity stores shared product data (title, price, URL, etc.)
 * User-specific data (targetPrice, notes, status) is stored in UserTrackedItem
 */
@Entity('tracked_items')
export class TrackedItem extends BaseEntity {
  @Column()
  @Index()
  storeId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ unique: true })
  @Index()
  productUrl: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ type: 'real', nullable: true })
  currentPrice: number;

  @Column({ default: 'EUR' })
  currency: string;

  @Column({ type: 'datetime', nullable: true })
  lastCheckedAt: Date;

  @Column({ nullable: true })
  category: string;

  @Column({ default: true })
  isAvailable: boolean;

  // Relations
  @ManyToOne(() => Store, (store) => store.trackedItems)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @OneToMany(() => PriceHistory, (history) => history.item)
  priceHistory: PriceHistory[];

  @OneToMany(() => UserTrackedItem, (userItem) => userItem.item)
  userTrackedItems: UserTrackedItem[];

  // ==================== BUSINESS LOGIC ====================

  updatePrice(newPrice: number, currency: string, isAvailable: boolean): void {
    this.currentPrice = newPrice;
    this.currency = currency;
    this.isAvailable = isAvailable;
    this.lastCheckedAt = new Date();
  }

  getFormattedPrice(): string {
    if (!this.currentPrice) return 'N/A';
    return `${this.currentPrice.toFixed(2)} ${this.currency}`;
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
}

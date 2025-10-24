import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { TrackedItem } from './tracked-item.entity';

@Entity('price_history')
@Index(['itemId', 'checkedAt'])
export class PriceHistory extends BaseEntity {
  @Column()
  itemId: string;

  @Column({ type: 'real' })
  price: number;

  @Column({ default: 'EUR' })
  currency: string;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  checkedAt: Date;

  // Relations
  @ManyToOne(() => TrackedItem, (item) => item.priceHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'itemId' })
  item: TrackedItem;
}

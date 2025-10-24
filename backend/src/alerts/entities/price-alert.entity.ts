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
import { TrackedItem } from '../../items/entities/tracked-item.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity('price_alerts')
@Index(['itemId', 'isActive'])
@Index(['userId'])
export class PriceAlert extends BaseEntity {
  @Column()
  userId: string;

  @Column()
  itemId: string;

  @Column()
  type: string; // "price_drop", "target_reached", "percentage_drop", "back_in_stock"

  @Column({ type: 'real', nullable: true })
  triggerPrice: number;

  @Column({ nullable: true })
  percentageDrop: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastTriggeredAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.alerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => TrackedItem, (item) => item.alerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: TrackedItem;

  @OneToMany(() => Notification, (notification) => notification.alert)
  notifications: Notification[];
}

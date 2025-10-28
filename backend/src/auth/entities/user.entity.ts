import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserTrackedItem } from '../../items/entities/user-tracked-item.entity';
import { PriceAlert } from '../../alerts/entities/price-alert.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: true })
  emailNotifications: boolean;

  // Relations
  @OneToMany(() => UserTrackedItem, (userItem) => userItem.user)
  userTrackedItems: UserTrackedItem[];

  @OneToMany(() => PriceAlert, (alert) => alert.user)
  alerts: PriceAlert[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}

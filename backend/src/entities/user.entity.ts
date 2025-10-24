import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TrackedItem } from './tracked-item.entity';
import { PriceAlert } from './price-alert.entity';
import { Notification } from './notification.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ default: true })
  emailNotifications: boolean;

  // Relations
  @OneToMany(() => TrackedItem, (item) => item.user)
  trackedItems: TrackedItem[];

  @OneToMany(() => PriceAlert, (alert) => alert.user)
  alerts: PriceAlert[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}

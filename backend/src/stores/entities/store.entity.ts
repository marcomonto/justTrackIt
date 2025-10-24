import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { TrackedItem } from '../../items/entities/tracked-item.entity';

@Entity('stores')
export class Store extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column({ default: 'html' })
  scrapeType: string; // "html", "api", "custom"

  @Column({ default: 5000 })
  minDelayMs: number;

  // Relations
  @OneToMany(() => TrackedItem, (item) => item.store)
  trackedItems: TrackedItem[];
}

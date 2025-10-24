import { PrimaryColumn, BeforeInsert, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ulid } from 'ulid';

export abstract class BaseEntity {
  @PrimaryColumn()
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}

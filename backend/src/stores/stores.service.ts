import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async create(createStoreDto: CreateStoreDto) {
    const store = this.storeRepository.create(createStoreDto);
    return this.storeRepository.save(store);
  }

  async findAll(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    return this.storeRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const store = await this.storeRepository.findOne({
      where: { id },
      relations: ['trackedItems'],
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return store;
  }

  async findByName(name: string) {
    return this.storeRepository.findOne({
      where: { name },
    });
  }

  async findByDomain(domain: string) {
    return this.storeRepository.findOne({
      where: { domain },
    });
  }

  async update(id: number, updateStoreDto: UpdateStoreDto) {
    await this.findOne(id); // Check if exists

    await this.storeRepository.update(id, updateStoreDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    await this.storeRepository.delete(id);
  }

  async getStoreFromUrl(url: string) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');

      const stores = await this.storeRepository.find({
        where: { isActive: true },
      });

      // Find store where domain contains hostname
      const store = stores.find((s) => s.domain && hostname.includes(s.domain));

      return store || null;
    } catch {
      return null;
    }
  }
}

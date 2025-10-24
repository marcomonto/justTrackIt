import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackedItem } from './entities/tracked-item.entity';
import { PriceHistory } from './entities/price-history.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreateTrackedItemDto } from './dto/create-tracked-item.dto';
import { UpdateTrackedItemDto } from './dto/update-tracked-item.dto';
import { ScrapersService } from '../scrapers/scrapers.service';
import { StoresService } from '../stores/stores.service';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(TrackedItem)
    private trackedItemRepository: Repository<TrackedItem>,
    @InjectRepository(PriceHistory)
    private priceHistoryRepository: Repository<PriceHistory>,
    private scrapersService: ScrapersService,
    private storesService: StoresService,
  ) {}

  // Legacy methods - replaced by TrackedItems
  // Kept for backward compatibility but not actively used
  async create(createItemDto: CreateItemDto, userId: string) {
    // Deprecated: Use createTrackedItem instead
    throw new BadRequestException('Use POST /api/items/tracked to create tracked items');
  }

  async findAll(userId: string, filter?: string) {
    // Deprecated: Use findAllTrackedItems instead
    return this.findAllTrackedItems(userId, filter as any);
  }

  async findOne(id: string, userId: string) {
    // Deprecated: Use findOneTrackedItem instead
    return this.findOneTrackedItem(id, userId);
  }

  async update(id: string, updateItemDto: UpdateItemDto, userId: string) {
    // Deprecated: Use updateTrackedItem instead
    throw new BadRequestException('Use PATCH /api/items/tracked/:id to update tracked items');
  }

  async remove(id: string, userId: string) {
    // Deprecated: Use removeTrackedItem instead
    return this.removeTrackedItem(id, userId);
  }

  async getStats(userId: string) {
    // Deprecated: Use getTrackedItemsStats instead
    return this.getTrackedItemsStats(userId);
  }

  // ==================== TRACKED ITEMS (Price Tracking) ====================

  async createTrackedItem(dto: CreateTrackedItemDto, userId: string) {
    // 1. Detect store from URL
    let store = await this.storesService.getStoreFromUrl(dto.productUrl);

    if (dto.storeId) {
      store = await this.storesService.findOne(dto.storeId);
    }

    if (!store) {
      throw new BadRequestException('Store not found or not supported for this URL');
    }

    // 2. Scrape product info
    const scrapedData = await this.scrapersService.scrapeProduct(dto.productUrl);

    // 3. Create tracked item
    const trackedItem = this.trackedItemRepository.create({
      userId,
      storeId: store.id,
      name: scrapedData.title || 'Unknown Product',
      description: scrapedData.title,
      imageUrl: scrapedData.imageUrl,
      productUrl: dto.productUrl,
      sku: scrapedData.sku,
      currentPrice: scrapedData.price,
      currency: scrapedData.currency,
      targetPrice: dto.targetPrice,
      category: dto.category,
      notes: dto.notes,
      isTracking: dto.isTracking ?? true,
      status: 'tracking',
      lastCheckedAt: new Date(),
    });

    const saved = await this.trackedItemRepository.save(trackedItem);

    // 4. Create initial price history entry
    await this.priceHistoryRepository.save(
      this.priceHistoryRepository.create({
        itemId: saved.id,
        price: scrapedData.price,
        currency: scrapedData.currency,
        isAvailable: scrapedData.isAvailable,
      }),
    );

    // 5. Return with relations
    return this.trackedItemRepository.findOne({
      where: { id: saved.id },
      relations: ['store'],
    });
  }

  async findAllTrackedItems(userId: string, filter?: 'tracking' | 'paused' | 'purchased') {
    const where: any = { userId };

    if (filter) {
      if (filter === 'tracking') {
        where.isTracking = true;
        where.status = 'tracking';
      } else {
        where.status = filter;
      }
    }

    const qb = this.trackedItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.store', 'store')
      .loadRelationCountAndMap('item.priceHistoryCount', 'item.priceHistory')
      .where(where)
      .orderBy('item.createdAt', 'DESC');

    return qb.getMany();
  }

  async findOneTrackedItem(id: string, userId: string) {
    const item = await this.trackedItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.store', 'store')
      .leftJoinAndSelect('item.priceHistory', 'priceHistory')
      .leftJoinAndSelect('item.alerts', 'alerts', 'alerts.isActive = :isActive', { isActive: true })
      .where('item.id = :id', { id })
      .orderBy('priceHistory.checkedAt', 'DESC')
      .limit(10)
      .getOne();

    if (!item) {
      throw new NotFoundException(`Tracked item with ID ${id} not found`);
    }

    if (item.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this item');
    }

    return item;
  }

  async updateTrackedItem(id: string, dto: UpdateTrackedItemDto, userId: string) {
    await this.findOneTrackedItem(id, userId);

    await this.trackedItemRepository.update(id, dto);

    return this.trackedItemRepository.findOne({
      where: { id },
      relations: ['store'],
    });
  }

  async removeTrackedItem(id: string, userId: string) {
    await this.findOneTrackedItem(id, userId);

    await this.trackedItemRepository.delete(id);
  }

  async refreshPrice(id: string, userId: string) {
    const item = await this.findOneTrackedItem(id, userId);

    // Scrape current price
    const scrapedData = await this.scrapersService.scrapeProduct(item.productUrl);

    // Update item using entity business logic
    item.updatePrice(scrapedData.price, scrapedData.currency);
    const updatedItem = await this.trackedItemRepository.save(item);

    // Add to price history
    await this.priceHistoryRepository.save(
      this.priceHistoryRepository.create({
        itemId: id,
        price: scrapedData.price,
        currency: scrapedData.currency,
        isAvailable: scrapedData.isAvailable,
      }),
    );

    return updatedItem;
  }

  async getPriceHistory(id: string, userId: string) {
    await this.findOneTrackedItem(id, userId);

    return this.priceHistoryRepository.find({
      where: { itemId: id },
      order: { checkedAt: 'DESC' },
    });
  }

  async getTrackedItemsStats(userId: string) {
    const total = await this.trackedItemRepository.count({
      where: { userId },
    });

    const tracking = await this.trackedItemRepository.count({
      where: { userId, isTracking: true },
    });

    // Get items with first 2 price history entries for savings calculation
    const items = await this.trackedItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.priceHistory', 'priceHistory')
      .where('item.userId = :userId', { userId })
      .orderBy('priceHistory.checkedAt', 'ASC')
      .getMany();

    // Calculate potential savings using entity business logic
    let totalSavings = 0;
    for (const item of items) {
      if (item.priceHistory && item.priceHistory.length >= 2) {
        const initialPrice = item.priceHistory[0].price;
        const savings = item.calculateSavings(initialPrice);
        totalSavings += savings;
      }
    }

    return {
      totalItems: total,
      activeTracking: tracking,
      potentialSavings: totalSavings,
    };
  }
}

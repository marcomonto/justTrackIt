import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackedItem } from './entities/tracked-item.entity';
import { UserTrackedItem } from './entities/user-tracked-item.entity';
import { PriceHistory } from './entities/price-history.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreateTrackedItemDto } from './dto/create-tracked-item.dto';
import { UpdateTrackedItemDto } from './dto/update-tracked-item.dto';
import { PreviewItemDto } from './dto/preview-item.dto';
import { ScrapersService } from '../scrapers/scrapers.service';
import { StoresService } from '../stores/stores.service';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(TrackedItem)
    private trackedItemRepository: Repository<TrackedItem>,
    @InjectRepository(UserTrackedItem)
    private userTrackedItemRepository: Repository<UserTrackedItem>,
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

  // ==================== PREVIEW (No save) ====================

  async previewItem(dto: PreviewItemDto) {
    const store = await this.storesService.getStoreFromUrl(dto.productUrl);
    if (!store) {
      throw new BadRequestException(
        'Store not found or not supported for this URL',
      );
    }

    // 2. Scrape product info without saving
    const scrapedData = await this.scrapersService.scrapeProduct(
      dto.productUrl,
    );

    // 3. Return preview data
    return {
      store: {
        id: store.id,
        name: store.name,
        domain: store.domain,
      },
      product: {
        title: scrapedData.title,
        price: scrapedData.price,
        currency: scrapedData.currency,
        imageUrl: scrapedData.imageUrl,
        sku: scrapedData.sku,
        isAvailable: scrapedData.isAvailable,
      },
      url: dto.productUrl,
    };
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

    // 3. Check if this product (SKU + storeId) already exists
    let trackedItem: TrackedItem | null = null;

    if (scrapedData.sku) {
      trackedItem = await this.trackedItemRepository.findOne({
        where: {
          sku: scrapedData.sku,
          storeId: store.id,
        },
      });
    }

    // 4a. If item doesn't exist, create it (shared data)
    if (!trackedItem) {
      trackedItem = this.trackedItemRepository.create({
        storeId: store.id,
        name: dto.name || scrapedData.title || 'Unknown Product',
        description: scrapedData.title,
        imageUrl: scrapedData.imageUrl,
        productUrl: dto.productUrl,
        sku: scrapedData.sku,
        currentPrice: scrapedData.price,
        currency: scrapedData.currency,
        category: dto.category,
        isAvailable: scrapedData.isAvailable,
        lastCheckedAt: new Date(),
      });

      trackedItem = await this.trackedItemRepository.save(trackedItem);

      // Create initial price history entry
      await this.priceHistoryRepository.save(
        this.priceHistoryRepository.create({
          itemId: trackedItem.id,
          price: scrapedData.price,
          currency: scrapedData.currency,
          isAvailable: scrapedData.isAvailable,
        }),
      );
    }

    // 4b. Check if user is already tracking this item
    const existingUserItem = await this.userTrackedItemRepository.findOne({
      where: {
        userId,
        itemId: trackedItem.id,
      },
    });

    if (existingUserItem) {
      throw new BadRequestException('You are already tracking this product');
    }

    // 5. Create user tracking association (personal data)
    const userTrackedItem = this.userTrackedItemRepository.create({
      userId,
      itemId: trackedItem.id,
      targetPrice: dto.targetPrice,
      notes: dto.notes,
      isTracking: dto.isTracking ?? true,
      status: 'tracking',
    });

    await this.userTrackedItemRepository.save(userTrackedItem);

    // 6. Return combined data for compatibility
    return this.getUserTrackedItemWithDetails(userTrackedItem.id);
  }

  /**
   * Helper: Get user tracked item with all details combined
   */
  private async getUserTrackedItemWithDetails(userTrackedItemId: string) {
    const userItem = await this.userTrackedItemRepository.findOne({
      where: { id: userTrackedItemId },
      relations: ['item', 'item.store'],
    });

    if (!userItem) {
      throw new NotFoundException('Tracked item not found');
    }

    // Combine UserTrackedItem (personal) + TrackedItem (shared) data
    return {
      id: userItem.id,
      userId: userItem.userId,
      storeId: userItem.item.storeId,
      name: userItem.item.name,
      description: userItem.item.description,
      imageUrl: userItem.item.imageUrl,
      productUrl: userItem.item.productUrl,
      sku: userItem.item.sku,
      currentPrice: userItem.item.currentPrice,
      currency: userItem.item.currency,
      targetPrice: userItem.targetPrice,
      isTracking: userItem.isTracking,
      lastCheckedAt: userItem.item.lastCheckedAt,
      category: userItem.item.category,
      status: userItem.status,
      notes: userItem.notes,
      isAvailable: userItem.item.isAvailable,
      store: userItem.item.store,
      createdAt: userItem.createdAt,
      updatedAt: userItem.updatedAt,
      // Keep itemId for internal use
      itemId: userItem.item.id,
    };
  }

  async findAllTrackedItems(userId: string, filter?: 'tracking' | 'paused' | 'purchased') {
    const qb = this.userTrackedItemRepository
      .createQueryBuilder('userItem')
      .leftJoinAndSelect('userItem.item', 'item')
      .leftJoinAndSelect('item.store', 'store')
      .loadRelationCountAndMap('item.priceHistoryCount', 'item.priceHistory')
      .where('userItem.userId = :userId', { userId });

    if (filter) {
      if (filter === 'tracking') {
        qb.andWhere('userItem.isTracking = :isTracking', { isTracking: true })
          .andWhere('userItem.status = :status', { status: 'tracking' });
      } else {
        qb.andWhere('userItem.status = :status', { status: filter });
      }
    }

    qb.orderBy('userItem.createdAt', 'DESC');

    const userItems = await qb.getMany();

    // Map to combined format
    return userItems.map((userItem) => ({
      id: userItem.id,
      userId: userItem.userId,
      storeId: userItem.item.storeId,
      name: userItem.item.name,
      description: userItem.item.description,
      imageUrl: userItem.item.imageUrl,
      productUrl: userItem.item.productUrl,
      sku: userItem.item.sku,
      currentPrice: userItem.item.currentPrice,
      currency: userItem.item.currency,
      targetPrice: userItem.targetPrice,
      isTracking: userItem.isTracking,
      lastCheckedAt: userItem.item.lastCheckedAt,
      category: userItem.item.category,
      status: userItem.status,
      notes: userItem.notes,
      isAvailable: userItem.item.isAvailable,
      store: userItem.item.store,
      createdAt: userItem.createdAt,
      updatedAt: userItem.updatedAt,
      itemId: userItem.item.id,
    }));
  }

  async findOneTrackedItem(id: string, userId: string) {
    const userItem = await this.userTrackedItemRepository
      .createQueryBuilder('userItem')
      .leftJoinAndSelect('userItem.item', 'item')
      .leftJoinAndSelect('item.store', 'store')
      .leftJoinAndSelect('item.priceHistory', 'priceHistory')
      .where('userItem.id = :id', { id })
      .andWhere('userItem.userId = :userId', { userId })
      .orderBy('priceHistory.checkedAt', 'DESC')
      .limit(30)
      .getOne();

    if (!userItem) {
      throw new NotFoundException(`Tracked item with ID ${id} not found`);
    }

    // Return combined format with price history
    return {
      id: userItem.id,
      userId: userItem.userId,
      storeId: userItem.item.storeId,
      name: userItem.item.name,
      description: userItem.item.description,
      imageUrl: userItem.item.imageUrl,
      productUrl: userItem.item.productUrl,
      sku: userItem.item.sku,
      currentPrice: userItem.item.currentPrice,
      currency: userItem.item.currency,
      targetPrice: userItem.targetPrice,
      isTracking: userItem.isTracking,
      lastCheckedAt: userItem.item.lastCheckedAt,
      category: userItem.item.category,
      status: userItem.status,
      notes: userItem.notes,
      isAvailable: userItem.item.isAvailable,
      store: userItem.item.store,
      priceHistory: userItem.item.priceHistory,
      createdAt: userItem.createdAt,
      updatedAt: userItem.updatedAt,
      itemId: userItem.item.id,
    };
  }

  async updateTrackedItem(id: string, dto: UpdateTrackedItemDto, userId: string) {
    // Verify ownership
    const userItem = await this.userTrackedItemRepository.findOne({
      where: { id, userId },
    });

    if (!userItem) {
      throw new NotFoundException(`Tracked item with ID ${id} not found`);
    }

    // Update only user-specific fields
    await this.userTrackedItemRepository.update(id, {
      targetPrice: dto.targetPrice,
      notes: dto.notes,
      status: dto.status,
      isTracking: dto.isTracking,
    });

    return this.getUserTrackedItemWithDetails(id);
  }

  async removeTrackedItem(id: string, userId: string) {
    // Verify ownership
    const userItem = await this.userTrackedItemRepository.findOne({
      where: { id, userId },
      relations: ['item'],
    });

    if (!userItem) {
      throw new NotFoundException(`Tracked item with ID ${id} not found`);
    }

    // Delete user association only
    await this.userTrackedItemRepository.delete(id);

    // Check if any other users are tracking this item
    const otherUsers = await this.userTrackedItemRepository.count({
      where: { itemId: userItem.itemId },
    });

    // If no one else is tracking, delete the TrackedItem and its history
    if (otherUsers === 0) {
      await this.trackedItemRepository.delete(userItem.itemId);
    }
  }

  async refreshPrice(id: string, userId: string) {
    const userItemData = await this.findOneTrackedItem(id, userId);

    // Scrape current price
    const scrapedData = await this.scrapersService.scrapeProduct(userItemData.productUrl);

    // Get the actual TrackedItem entity to update
    const trackedItem = await this.trackedItemRepository.findOne({
      where: { id: userItemData.itemId },
    });

    if (!trackedItem) {
      throw new NotFoundException('Tracked item not found');
    }

    // Update shared item data using entity business logic
    trackedItem.updatePrice(scrapedData.price, scrapedData.currency, scrapedData.isAvailable);
    await this.trackedItemRepository.save(trackedItem);

    // Add to price history
    await this.priceHistoryRepository.save(
      this.priceHistoryRepository.create({
        itemId: trackedItem.id,
        price: scrapedData.price,
        currency: scrapedData.currency,
        isAvailable: scrapedData.isAvailable,
      }),
    );

    // Return updated combined data
    return this.getUserTrackedItemWithDetails(id);
  }

  async getPriceHistory(id: string, userId: string) {
    const userItemData = await this.findOneTrackedItem(id, userId);

    return this.priceHistoryRepository.find({
      where: { itemId: userItemData.itemId },
      order: { checkedAt: 'DESC' },
    });
  }

  async getTrackedItemsStats(userId: string) {
    const total = await this.userTrackedItemRepository.count({
      where: { userId },
    });

    const tracking = await this.userTrackedItemRepository.count({
      where: { userId, isTracking: true },
    });

    // Get user items with their tracked items and price history
    const userItems = await this.userTrackedItemRepository
      .createQueryBuilder('userItem')
      .leftJoinAndSelect('userItem.item', 'item')
      .leftJoinAndSelect('item.priceHistory', 'priceHistory')
      .where('userItem.userId = :userId', { userId })
      .orderBy('priceHistory.checkedAt', 'ASC')
      .getMany();

    // Calculate potential savings using entity business logic
    let totalSavings = 0;
    for (const userItem of userItems) {
      if (userItem.item.priceHistory && userItem.item.priceHistory.length >= 2) {
        const initialPrice = userItem.item.priceHistory[0].price;
        const savings = userItem.item.calculateSavings(initialPrice);
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

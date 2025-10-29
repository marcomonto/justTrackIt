import { Test, TestingModule } from '@nestjs/testing';
import { ItemsController } from '../../src/items/items.controller';
import { ItemsService } from '../../src/items/items.service';
import { CreateItemDto } from '../../src/items/dto/create-item.dto';
import { UpdateItemDto } from '../../src/items/dto/update-item.dto';
import { CreateTrackedItemDto } from '../../src/items/dto/create-tracked-item.dto';
import { UpdateTrackedItemDto } from '../../src/items/dto/update-tracked-item.dto';
import { PreviewItemDto } from '../../src/items/dto/preview-item.dto';
import { NotFoundException } from '@nestjs/common';

describe('ItemsController', () => {
  let controller: ItemsController;
  let service: ItemsService;

  const mockItemsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getStats: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    previewItem: jest.fn(),
    createTrackedItem: jest.fn(),
    findAllTrackedItems: jest.fn(),
    getTrackedItemsStats: jest.fn(),
    findOneTrackedItem: jest.fn(),
    getPriceHistory: jest.fn(),
    refreshPrice: jest.fn(),
    updateTrackedItem: jest.fn(),
    removeTrackedItem: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user-1', email: 'test@example.com' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
      ],
    }).compile();

    controller = module.get<ItemsController>(ItemsController);
    service = module.get<ItemsService>(ItemsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const createDto: CreateItemDto = {
        name: 'Test Item',
        url: 'https://example.com/item',
        storeId: 'store-1',
      };

      const mockItem = { id: 'item-1', ...createDto, userId: 'user-1' };
      mockItemsService.create.mockResolvedValue(mockItem);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, 'user-1');
      expect(result).toEqual(mockItem);
    });
  });

  describe('findAll', () => {
    it('should return all items for user', async () => {
      const mockItems = [
        { id: 'item-1', name: 'Item 1' },
        { id: 'item-2', name: 'Item 2' },
      ];
      mockItemsService.findAll.mockResolvedValue(mockItems);

      const result = await controller.findAll(undefined, mockRequest);

      expect(service.findAll).toHaveBeenCalledWith('user-1', undefined);
      expect(result).toEqual(mockItems);
    });

    it('should return filtered items', async () => {
      const mockItems = [{ id: 'item-1', name: 'Item 1' }];
      mockItemsService.findAll.mockResolvedValue(mockItems);

      const result = await controller.findAll('active', mockRequest);

      expect(service.findAll).toHaveBeenCalledWith('user-1', 'active');
      expect(result).toEqual(mockItems);
    });
  });

  describe('getStats', () => {
    it('should return user stats', async () => {
      const mockStats = { totalItems: 10, activeItems: 5 };
      mockItemsService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(mockRequest);

      expect(service.getStats).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockStats);
    });
  });

  describe('findOne', () => {
    it('should return a single item', async () => {
      const mockItem = { id: 'item-1', name: 'Item 1' };
      mockItemsService.findOne.mockResolvedValue(mockItem);

      const result = await controller.findOne('item-1', mockRequest);

      expect(service.findOne).toHaveBeenCalledWith('item-1', 'user-1');
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockItemsService.findOne.mockRejectedValue(
        new NotFoundException('Item not found'),
      );

      await expect(
        controller.findOne('non-existent', mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const updateDto: UpdateItemDto = { name: 'Updated Item' };
      const mockUpdated = { id: 'item-1', name: 'Updated Item' };
      mockItemsService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update('item-1', updateDto, mockRequest);

      expect(service.update).toHaveBeenCalledWith('item-1', updateDto, 'user-1');
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('remove', () => {
    it('should remove an item', async () => {
      mockItemsService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove('item-1', mockRequest);

      expect(service.remove).toHaveBeenCalledWith('item-1', 'user-1');
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('previewItem', () => {
    it('should preview item from URL', async () => {
      const previewDto: PreviewItemDto = { url: 'https://example.com/item' };
      const mockPreview = {
        name: 'Preview Item',
        price: 99.99,
        imageUrl: 'https://example.com/image.jpg',
      };
      mockItemsService.previewItem.mockResolvedValue(mockPreview);

      const result = await controller.previewItem(previewDto);

      expect(service.previewItem).toHaveBeenCalledWith(previewDto);
      expect(result).toEqual(mockPreview);
    });
  });

  describe('Tracked Items', () => {
    describe('createTrackedItem', () => {
      it('should create a tracked item', async () => {
        const createDto: CreateTrackedItemDto = {
          url: 'https://example.com/item',
          targetPrice: 50,
        };
        const mockTracked = { id: 'tracked-1', ...createDto };
        mockItemsService.createTrackedItem.mockResolvedValue(mockTracked);

        const result = await controller.createTrackedItem(createDto, mockRequest);

        expect(service.createTrackedItem).toHaveBeenCalledWith(createDto, 'user-1');
        expect(result).toEqual(mockTracked);
      });
    });

    describe('findAllTrackedItems', () => {
      it('should return all tracked items', async () => {
        const mockTracked = [
          { id: 'tracked-1', status: 'tracking' },
          { id: 'tracked-2', status: 'tracking' },
        ];
        mockItemsService.findAllTrackedItems.mockResolvedValue(mockTracked);

        const result = await controller.findAllTrackedItems(undefined, mockRequest);

        expect(service.findAllTrackedItems).toHaveBeenCalledWith('user-1', undefined);
        expect(result).toEqual(mockTracked);
      });

      it('should return filtered tracked items', async () => {
        const mockTracked = [{ id: 'tracked-1', status: 'tracking' }];
        mockItemsService.findAllTrackedItems.mockResolvedValue(mockTracked);

        const result = await controller.findAllTrackedItems('tracking', mockRequest);

        expect(service.findAllTrackedItems).toHaveBeenCalledWith('user-1', 'tracking');
        expect(result).toEqual(mockTracked);
      });
    });

    describe('getTrackedItemsStats', () => {
      it('should return tracked items stats', async () => {
        const mockStats = { totalTracked: 5, tracking: 3, paused: 2 };
        mockItemsService.getTrackedItemsStats.mockResolvedValue(mockStats);

        const result = await controller.getTrackedItemsStats(mockRequest);

        expect(service.getTrackedItemsStats).toHaveBeenCalledWith('user-1');
        expect(result).toEqual(mockStats);
      });
    });

    describe('findOneTrackedItem', () => {
      it('should return a tracked item', async () => {
        const mockTracked = { id: 'tracked-1', currentPrice: 60 };
        mockItemsService.findOneTrackedItem.mockResolvedValue(mockTracked);

        const result = await controller.findOneTrackedItem('tracked-1', mockRequest);

        expect(service.findOneTrackedItem).toHaveBeenCalledWith('tracked-1', 'user-1');
        expect(result).toEqual(mockTracked);
      });
    });

    describe('getPriceHistory', () => {
      it('should return price history', async () => {
        const mockHistory = [
          { date: '2024-01-01', price: 100 },
          { date: '2024-01-02', price: 95 },
        ];
        mockItemsService.getPriceHistory.mockResolvedValue(mockHistory);

        const result = await controller.getPriceHistory('tracked-1', mockRequest);

        expect(service.getPriceHistory).toHaveBeenCalledWith('tracked-1', 'user-1');
        expect(result).toEqual(mockHistory);
      });
    });

    describe('refreshPrice', () => {
      it('should refresh item price', async () => {
        const mockRefreshed = { id: 'tracked-1', currentPrice: 85 };
        mockItemsService.refreshPrice.mockResolvedValue(mockRefreshed);

        const result = await controller.refreshPrice('tracked-1', mockRequest);

        expect(service.refreshPrice).toHaveBeenCalledWith('tracked-1', 'user-1');
        expect(result).toEqual(mockRefreshed);
      });
    });

    describe('updateTrackedItem', () => {
      it('should update a tracked item', async () => {
        const updateDto: UpdateTrackedItemDto = { targetPrice: 45 };
        const mockUpdated = { id: 'tracked-1', targetPrice: 45 };
        mockItemsService.updateTrackedItem.mockResolvedValue(mockUpdated);

        const result = await controller.updateTrackedItem(
          'tracked-1',
          updateDto,
          mockRequest,
        );

        expect(service.updateTrackedItem).toHaveBeenCalledWith(
          'tracked-1',
          updateDto,
          'user-1',
        );
        expect(result).toEqual(mockUpdated);
      });
    });

    describe('removeTrackedItem', () => {
      it('should remove a tracked item', async () => {
        mockItemsService.removeTrackedItem.mockResolvedValue({ deleted: true });

        const result = await controller.removeTrackedItem('tracked-1', mockRequest);

        expect(service.removeTrackedItem).toHaveBeenCalledWith('tracked-1', 'user-1');
        expect(result).toEqual({ deleted: true });
      });
    });
  });
});

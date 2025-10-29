import { Test, TestingModule } from '@nestjs/testing';
import { StoresController } from '../../src/stores/stores.controller';
import { StoresService } from '../../src/stores/stores.service';
import { CreateStoreDto } from '../../src/stores/dto/create-store.dto';
import { UpdateStoreDto } from '../../src/stores/dto/update-store.dto';
import { NotFoundException } from '@nestjs/common';

describe('StoresController', () => {
  let controller: StoresController;
  let service: StoresService;

  const mockStoresService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoresController],
      providers: [
        {
          provide: StoresService,
          useValue: mockStoresService,
        },
      ],
    }).compile();

    controller = module.get<StoresController>(StoresController);
    service = module.get<StoresService>(StoresService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new store', async () => {
      const createDto: CreateStoreDto = {
        name: 'Test Store',
        domain: 'teststore.com',
        isActive: true,
      };

      const mockStore = { id: 'store-1', ...createDto };
      mockStoresService.create.mockResolvedValue(mockStore);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockStore);
    });
  });

  describe('findAll', () => {
    it('should return all stores', async () => {
      const mockStores = [
        { id: 'store-1', name: 'Store 1', isActive: true },
        { id: 'store-2', name: 'Store 2', isActive: true },
        { id: 'store-3', name: 'Store 3', isActive: false },
      ];
      mockStoresService.findAll.mockResolvedValue(mockStores);

      const result = await controller.findAll(undefined);

      expect(service.findAll).toHaveBeenCalledWith(false);
      expect(result).toEqual(mockStores);
    });

    it('should return only active stores when activeOnly is true', async () => {
      const mockStores = [
        { id: 'store-1', name: 'Store 1', isActive: true },
        { id: 'store-2', name: 'Store 2', isActive: true },
      ];
      mockStoresService.findAll.mockResolvedValue(mockStores);

      const result = await controller.findAll('true');

      expect(service.findAll).toHaveBeenCalledWith(true);
      expect(result).toEqual(mockStores);
    });
  });

  describe('findOne', () => {
    it('should return a single store', async () => {
      const mockStore = { id: 'store-1', name: 'Store 1' };
      mockStoresService.findOne.mockResolvedValue(mockStore);

      const result = await controller.findOne('store-1');

      expect(service.findOne).toHaveBeenCalledWith('store-1');
      expect(result).toEqual(mockStore);
    });

    it('should throw NotFoundException when store not found', async () => {
      mockStoresService.findOne.mockRejectedValue(
        new NotFoundException('Store not found'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a store', async () => {
      const updateDto: UpdateStoreDto = { name: 'Updated Store' };
      const mockUpdated = { id: 'store-1', name: 'Updated Store' };
      mockStoresService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update('store-1', updateDto);

      expect(service.update).toHaveBeenCalledWith('store-1', updateDto);
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('remove', () => {
    it('should remove a store', async () => {
      mockStoresService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove('store-1');

      expect(service.remove).toHaveBeenCalledWith('store-1');
      expect(result).toEqual({ deleted: true });
    });
  });
});

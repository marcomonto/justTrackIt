import { Test, TestingModule } from '@nestjs/testing';
import { AlertsController } from '../../src/alerts/alerts.controller';
import { AlertsService } from '../../src/alerts/alerts.service';
import { CreateAlertDto } from '../../src/alerts/dto/create-alert.dto';
import { UpdateAlertDto } from '../../src/alerts/dto/update-alert.dto';
import { NotFoundException } from '@nestjs/common';

describe('AlertsController', () => {
  let controller: AlertsController;
  let service: AlertsService;

  const mockAlertsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByItem: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user-1', email: 'test@example.com' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [
        {
          provide: AlertsService,
          useValue: mockAlertsService,
        },
      ],
    }).compile();

    controller = module.get<AlertsController>(AlertsController);
    service = module.get<AlertsService>(AlertsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new alert', async () => {
      const createDto: CreateAlertDto = {
        itemId: 'item-1',
        targetPrice: 50,
        alertType: 'price_drop',
      };

      const mockAlert = { id: 'alert-1', ...createDto, userId: 'user-1' };
      mockAlertsService.create.mockResolvedValue(mockAlert);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, 'user-1');
      expect(result).toEqual(mockAlert);
    });
  });

  describe('findAll', () => {
    it('should return all alerts for user', async () => {
      const mockAlerts = [
        { id: 'alert-1', targetPrice: 50, isActive: true },
        { id: 'alert-2', targetPrice: 30, isActive: true },
        { id: 'alert-3', targetPrice: 20, isActive: false },
      ];
      mockAlertsService.findAll.mockResolvedValue(mockAlerts);

      const result = await controller.findAll(undefined, mockRequest);

      expect(service.findAll).toHaveBeenCalledWith('user-1', false);
      expect(result).toEqual(mockAlerts);
    });

    it('should return only active alerts when activeOnly is true', async () => {
      const mockAlerts = [
        { id: 'alert-1', targetPrice: 50, isActive: true },
        { id: 'alert-2', targetPrice: 30, isActive: true },
      ];
      mockAlertsService.findAll.mockResolvedValue(mockAlerts);

      const result = await controller.findAll('true', mockRequest);

      expect(service.findAll).toHaveBeenCalledWith('user-1', true);
      expect(result).toEqual(mockAlerts);
    });
  });

  describe('findByItem', () => {
    it('should return alerts for specific item', async () => {
      const mockAlerts = [
        { id: 'alert-1', itemId: 'item-1', targetPrice: 50 },
      ];
      mockAlertsService.findByItem.mockResolvedValue(mockAlerts);

      const result = await controller.findByItem('item-1', mockRequest);

      expect(service.findByItem).toHaveBeenCalledWith('item-1', 'user-1');
      expect(result).toEqual(mockAlerts);
    });
  });

  describe('findOne', () => {
    it('should return a single alert', async () => {
      const mockAlert = { id: 'alert-1', targetPrice: 50 };
      mockAlertsService.findOne.mockResolvedValue(mockAlert);

      const result = await controller.findOne('alert-1', mockRequest);

      expect(service.findOne).toHaveBeenCalledWith('alert-1', 'user-1');
      expect(result).toEqual(mockAlert);
    });

    it('should throw NotFoundException when alert not found', async () => {
      mockAlertsService.findOne.mockRejectedValue(
        new NotFoundException('Alert not found'),
      );

      await expect(
        controller.findOne('non-existent', mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an alert', async () => {
      const updateDto: UpdateAlertDto = { targetPrice: 40 };
      const mockUpdated = { id: 'alert-1', targetPrice: 40 };
      mockAlertsService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update('alert-1', updateDto, mockRequest);

      expect(service.update).toHaveBeenCalledWith('alert-1', updateDto, 'user-1');
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('remove', () => {
    it('should remove an alert', async () => {
      mockAlertsService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove('alert-1', mockRequest);

      expect(service.remove).toHaveBeenCalledWith('alert-1', 'user-1');
      expect(result).toEqual({ deleted: true });
    });
  });
});

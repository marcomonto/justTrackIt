import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from '../../src/notifications/notifications.controller';
import { NotificationsService } from '../../src/notifications/notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    findAll: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user-1', email: 'test@example.com' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all notifications with default limit', async () => {
      const mockNotifications = [
        { id: 'notif-1', message: 'Price dropped', read: false },
        { id: 'notif-2', message: 'Item available', read: true },
      ];
      mockNotificationsService.findAll.mockResolvedValue(mockNotifications);

      const result = await controller.findAll(undefined, mockRequest);

      expect(service.findAll).toHaveBeenCalledWith('user-1', 50);
      expect(result).toEqual(mockNotifications);
    });

    it('should return notifications with custom limit', async () => {
      const mockNotifications = [
        { id: 'notif-1', message: 'Price dropped', read: false },
      ];
      mockNotificationsService.findAll.mockResolvedValue(mockNotifications);

      const result = await controller.findAll('10', mockRequest);

      expect(service.findAll).toHaveBeenCalledWith('user-1', 10);
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const mockCount = { count: 5 };
      mockNotificationsService.getUnreadCount.mockResolvedValue(mockCount);

      const result = await controller.getUnreadCount(mockRequest);

      expect(service.getUnreadCount).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockCount);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockUpdated = { id: 'notif-1', read: true };
      mockNotificationsService.markAsRead.mockResolvedValue(mockUpdated);

      const result = await controller.markAsRead('notif-1', mockRequest);

      expect(service.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
      expect(result).toEqual(mockUpdated);
    });
  });
});

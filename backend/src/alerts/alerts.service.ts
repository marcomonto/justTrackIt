import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceAlert } from '../entities/price-alert.entity';
import { TrackedItem } from '../entities/tracked-item.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(PriceAlert)
    private alertRepository: Repository<PriceAlert>,
    @InjectRepository(TrackedItem)
    private trackedItemRepository: Repository<TrackedItem>,
  ) {}

  async create(createAlertDto: CreateAlertDto, userId: number) {
    // Verify item belongs to user
    const item = await this.trackedItemRepository.findOne({
      where: { id: createAlertDto.itemId },
    });

    if (!item) {
      throw new NotFoundException(
        `Tracked item with ID ${createAlertDto.itemId} not found`,
      );
    }

    if (item.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to create alerts for this item',
      );
    }

    // Validate alert type requirements
    this.validateAlertData(createAlertDto);

    const alert = this.alertRepository.create({
      userId,
      itemId: createAlertDto.itemId,
      type: createAlertDto.type,
      triggerPrice: createAlertDto.triggerPrice,
      percentageDrop: createAlertDto.percentageDrop,
    });

    const saved = await this.alertRepository.save(alert);

    return this.alertRepository.findOne({
      where: { id: saved.id },
      relations: ['item', 'item.store'],
    });
  }

  async findAll(userId: number, activeOnly = false) {
    const where: any = { userId };
    if (activeOnly) {
      where.isActive = true;
    }

    return this.alertRepository.find({
      where,
      relations: ['item', 'item.store'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const alert = await this.alertRepository.findOne({
      where: { id },
      relations: ['item', 'item.store', 'notifications'],
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    if (alert.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this alert',
      );
    }

    return alert;
  }

  async update(id: number, updateAlertDto: UpdateAlertDto, userId: number) {
    await this.findOne(id, userId);

    await this.alertRepository.update(id, updateAlertDto);
    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);

    await this.alertRepository.delete(id);
  }

  async findByItem(itemId: number, userId: number) {
    // Verify item belongs to user
    const item = await this.trackedItemRepository.findOne({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException(`Tracked item with ID ${itemId} not found`);
    }

    if (item.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access alerts for this item',
      );
    }

    return this.alertRepository.find({
      where: { itemId },
      order: { createdAt: 'DESC' },
    });
  }

  private validateAlertData(dto: CreateAlertDto) {
    switch (dto.type) {
      case 'target_reached':
        if (!dto.triggerPrice) {
          throw new BadRequestException(
            'triggerPrice is required for target_reached alerts',
          );
        }
        break;

      case 'percentage_drop':
        if (!dto.percentageDrop) {
          throw new BadRequestException(
            'percentageDrop is required for percentage_drop alerts',
          );
        }
        break;

      case 'price_drop':
      case 'back_in_stock':
        // No additional validation needed
        break;

      default:
        throw new BadRequestException(`Invalid alert type: ${dto.type}`);
    }
  }
}

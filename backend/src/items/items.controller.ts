import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreateTrackedItemDto } from './dto/create-tracked-item.dto';
import { UpdateTrackedItemDto } from './dto/update-tracked-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  create(@Body(new ValidationPipe()) createItemDto: CreateItemDto, @Request() req) {
    return this.itemsService.create(createItemDto, req.user.id);
  }

  @Get()
  findAll(@Query('filter') filter: string, @Request() req) {
    return this.itemsService.findAll(req.user.id, filter);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.itemsService.getStats(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.itemsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateItemDto: UpdateItemDto,
    @Request() req,
  ) {
    return this.itemsService.update(id, updateItemDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.itemsService.remove(id, req.user.id);
  }

  // ==================== TRACKED ITEMS ROUTES ====================

  @Post('tracked')
  createTrackedItem(
    @Body(new ValidationPipe()) dto: CreateTrackedItemDto,
    @Request() req,
  ) {
    return this.itemsService.createTrackedItem(dto, req.user.id);
  }

  @Get('tracked')
  findAllTrackedItems(
    @Query('filter') filter: 'tracking' | 'paused' | 'purchased',
    @Request() req,
  ) {
    return this.itemsService.findAllTrackedItems(req.user.id, filter);
  }

  @Get('tracked/stats')
  getTrackedItemsStats(@Request() req) {
    return this.itemsService.getTrackedItemsStats(req.user.id);
  }

  @Get('tracked/:id')
  findOneTrackedItem(@Param('id') id: string, @Request() req) {
    return this.itemsService.findOneTrackedItem(id, req.user.id);
  }

  @Get('tracked/:id/history')
  getPriceHistory(@Param('id') id: string, @Request() req) {
    return this.itemsService.getPriceHistory(id, req.user.id);
  }

  @Post('tracked/:id/refresh')
  refreshPrice(@Param('id') id: string, @Request() req) {
    return this.itemsService.refreshPrice(id, req.user.id);
  }

  @Patch('tracked/:id')
  updateTrackedItem(
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: UpdateTrackedItemDto,
    @Request() req,
  ) {
    return this.itemsService.updateTrackedItem(id, dto, req.user.id);
  }

  @Delete('tracked/:id')
  removeTrackedItem(@Param('id') id: string, @Request() req) {
    return this.itemsService.removeTrackedItem(id, req.user.id);
  }
}

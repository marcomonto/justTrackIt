import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  create(
    @Body() createAlertDto: CreateAlertDto,
    @Request() req,
  ) {
    return this.alertsService.create(createAlertDto, req.user.id);
  }

  @Get()
  findAll(@Query('activeOnly') activeOnly: string, @Request() req) {
    return this.alertsService.findAll(req.user.id, activeOnly === 'true');
  }

  @Get('item/:itemId')
  findByItem(@Param('itemId') itemId: string, @Request() req) {
    return this.alertsService.findByItem(itemId, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.alertsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAlertDto: UpdateAlertDto,
    @Request() req,
  ) {
    return this.alertsService.update(id, updateAlertDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.alertsService.remove(id, req.user.id);
  }
}

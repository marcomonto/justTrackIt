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
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
  }

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.storesService.findAll(activeOnly === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    return this.storesService.update(id, updateStoreDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}

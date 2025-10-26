import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';

@Injectable()
export class StoresSeedService implements OnModuleInit {
  private readonly logger = new Logger(StoresSeedService.name);

  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async onModuleInit() {
    await this.seedStores();
  }

  private async seedStores() {
    const count = await this.storeRepository.count();

    if (count > 0) {
      this.logger.log('Stores already seeded, skipping...');
      return;
    }

    this.logger.log('Seeding default stores...');

    const defaultStores = [
      {
        name: 'Amazon',
        domain: 'amazon.*',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        isActive: true,
        scrapeType: 'html',
        minDelayMs: 5000,
      },
      {
        name: 'eBay',
        domain: 'ebay.*',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg',
        isActive: true,
        scrapeType: 'html',
        minDelayMs: 5000,
      },
      {
        name: 'Lookfantastic',
        domain: 'lookfantastic.*',
        logoUrl: 'https://www.lookfantastic.it/img/lookfantastic-logo.svg',
        isActive: true,
        scrapeType: 'html',
        minDelayMs: 5000,
      },
      {
        name: 'Zalando',
        domain: 'zalando.*',
        logoUrl: 'https://img01.ztat.net/nvg/zalando-logo.svg',
        isActive: true,
        scrapeType: 'html',
        minDelayMs: 5000,
      },
      {
        name: 'Sephora',
        domain: 'sephora.*',
        logoUrl: 'https://www.sephora.it/on/demandware.static/Sites-Sephora_IT-Site/-/default/dw7c3b8e3e/images/logo.svg',
        isActive: true,
        scrapeType: 'html',
        minDelayMs: 5000,
      },
      {
        name: 'Pinalli',
        domain: 'pinalli.it',
        logoUrl: 'https://www.pinalli.it/static/version1732722124/frontend/Pinalli/default/it_IT/images/logo.svg',
        isActive: true,
        scrapeType: 'html',
        minDelayMs: 5000,
      },
    ];

    for (const storeData of defaultStores) {
      const store = this.storeRepository.create(storeData);
      await this.storeRepository.save(store);
      this.logger.log(`✅ Created store: ${storeData.name}`);
    }

    this.logger.log('✅ Stores seeding completed!');
  }
}

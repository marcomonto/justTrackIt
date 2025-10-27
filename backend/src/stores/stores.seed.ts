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
        brandColor: '#FF9900',
        isActive: true,
        scrapeType: 'html',
        minDelayMs: 5000,
      },
      {
        name: 'eBay',
        domain: 'ebay.*',
        logoUrl:
          'https://cdn.brandfetch.io/idjTS-RPU1/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1758874119233',
        brandColor: '#E53238',
        isActive: true,
        scrapeType: 'html',
        minDelayMs: 5000,
      },
      {
        name: 'Lookfantastic',
        domain: 'lookfantastic.*',
        logoUrl:
          'https://cdn.brandfetch.io/idmnTqUvxX/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1756265188113',
        brandColor: '#1A1A1A',
        isActive: true,
        scrapeType: 'html',
        minDelayMs: 5000,
      },
      {
        name: 'Zalando',
        domain: 'zalando.*',
        logoUrl: 'https://cdn.brandfetch.io/idU9zqzhO3/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1668435054810',
        brandColor: '#FF6900',
        isActive: true,
        scrapeType: 'html',
        minDelayMs: 5000,
      },
      {
        name: 'Sephora',
        domain: 'sephora.*',
        logoUrl:
          'https://cdn.brandfetch.io/idlz-76_gh/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668413446337',
        brandColor: '#000000',
        isActive: true,
        scrapeType: 'html',
        minDelayMs: 5000,
      },
      {
        name: 'Pinalli',
        domain: 'pinalli.it',
        logoUrl:
          'https://cdn.brandfetch.io/idVgzcbPXP/w/1875/h/1875/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1758433313279',
        brandColor: '#D4AF37',
        isActive: true,
        scrapeType: 'html',
        minDelayMs: 5000,
      },
      {
        name: 'Veralab',
        domain: 'veralab.it',
        logoUrl:
          'https://cdn.brandfetch.io/idCVALM_Di/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1748342852848',
        brandColor: '#d90092',
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

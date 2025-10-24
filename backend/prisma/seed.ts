import { DataSource } from 'typeorm';
import { Store } from '../src/entities/store.entity';
import { User } from '../src/entities/user.entity';
import { TrackedItem } from '../src/entities/tracked-item.entity';
import { PriceHistory } from '../src/entities/price-history.entity';
import { PriceAlert } from '../src/entities/price-alert.entity';
import { Notification } from '../src/entities/notification.entity';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'justtrackit.db',
  entities: [User, Store, TrackedItem, PriceHistory, PriceAlert, Notification],
  synchronize: true,
});

async function main() {
  console.log('Seeding database...');

  await AppDataSource.initialize();
  const storeRepository = AppDataSource.getRepository(Store);

  // Create default stores
  const stores = [
    {
      name: 'Amazon IT',
      domain: 'amazon.it',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
      isActive: true,
      scrapeType: 'html' as const,
      minDelayMs: 5000,
    },
    {
      name: 'Amazon',
      domain: 'amazon.com',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
      isActive: true,
      scrapeType: 'html' as const,
      minDelayMs: 5000,
    },
    {
      name: 'eBay IT',
      domain: 'ebay.it',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg',
      isActive: true,
      scrapeType: 'html' as const,
      minDelayMs: 5000,
    },
    {
      name: 'eBay',
      domain: 'ebay.com',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg',
      isActive: true,
      scrapeType: 'html' as const,
      minDelayMs: 5000,
    },
  ];

  for (const storeData of stores) {
    const existingStore = await storeRepository.findOne({
      where: { name: storeData.name },
    });

    if (existingStore) {
      await storeRepository.update(existingStore.id, storeData);
      console.log(`✓ Updated store: ${storeData.name}`);
    } else {
      await storeRepository.save(storeRepository.create(storeData));
      console.log(`✓ Created store: ${storeData.name}`);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await AppDataSource.destroy();
  });

# Migrazione da Prisma a TypeORM - JustTrackIt

## ✅ Completato

### 1. Installazione TypeORM
- ✅ Installato `@nestjs/typeorm`, `typeorm`, `sqlite3`

### 2. Entity TypeORM create
- ✅ User entity (`src/entities/user.entity.ts`)
- ✅ Store entity (`src/entities/store.entity.ts`)
- ✅ TrackedItem entity (`src/entities/tracked-item.entity.ts`)
- ✅ PriceHistory entity (`src/entities/price-history.entity.ts`)
- ✅ PriceAlert entity (`src/entities/price-alert.entity.ts`)
- ✅ Notification entity (`src/entities/notification.entity.ts`)

Tutte le entity includono:
- Decoratori TypeORM appropriati
- Relazioni OneToMany/ManyToOne
- Indici per performance
- Business logic methods (es: `hasReachedTargetPrice()`, `calculateSavings()`)

### 3. Configurazione TypeORM
- ✅ AppModule aggiornato con `TypeOrmModule.forRoot()`
- ✅ Database: SQLite (`justtrack it.db`)
- ✅ `synchronize: true` (auto-sync schema in dev)

### 4. Auth Module
- ✅ AuthService aggiornato per usare `Repository<User>`
- ✅ AuthModule con `TypeOrmModule.forFeature([User])`
- ✅ Eliminato PrismaService

## ⏳ Da Completare

Gli altri moduli devono essere aggiornati seguendo lo stesso pattern di AuthModule:

### Pattern di Migrazione

**1. Service:**
```typescript
// PRIMA (Prisma)
constructor(private prisma: PrismaService) {}

async findAll() {
  return this.prisma.trackedItem.findMany();
}

// DOPO (TypeORM)
constructor(
  @InjectRepository(TrackedItem)
  private trackedItemRepository: Repository<TrackedItem>,
) {}

async findAll() {
  return this.trackedItemRepository.find();
}
```

**2. Module:**
```typescript
// PRIMA
@Module({
  imports: [PrismaModule],
  providers: [Service, PrismaService],
})

// DOPO
@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  providers: [Service],
})
```

### Moduli da aggiornare:

1. **StoresModule**
   - StoresService → `Repository<Store>`
   - StoresModule → `TypeOrmModule.forFeature([Store])`

2. **ItemsModule**
   - ItemsService → `Repository<TrackedItem>`, `Repository<PriceHistory>`
   - ItemsModule → `TypeOrmModule.forFeature([TrackedItem, PriceHistory])`

3. **AlertsModule**
   - AlertsService → `Repository<PriceAlert>`
   - AlertsModule → `TypeOrmModule.forFeature([PriceAlert])`

4. **NotificationsModule**
   - NotificationsService → `Repository<Notification>`
   - NotificationsModule → `TypeOrmModule.forFeature([Notification])`

5. **SchedulerService**
   - Inject `Repository<TrackedItem>`, `Repository<PriceHistory>`, `Repository<PriceAlert>`, `Repository<Notification>`
   - Aggiorna SchedulerModule

## 🗑️ Files da Rimuovere

Dopo la migrazione completa:
- `src/prisma.service.ts`
- `src/prisma.module.ts`
- `prisma/schema.prisma`
- `prisma/migrations/`
- `prisma/seed.ts`

Disinstallare:
```bash
npm uninstall @prisma/client prisma
```

## 📊 Mapping Prisma → TypeORM

| Prisma | TypeORM |
|--------|---------|
| `findUnique({ where: { id } })` | `findOne({ where: { id } })` |
| `findMany({ where: {} })` | `find({ where: {} })` |
| `create({ data: {} })` | `create({}).save()` |
| `update({ where, data })` | `update(where, data)` |
| `delete({ where })` | `delete(where)` |
| `include: { relation: true }` | `relations: ['relation']` |
| `_count: { select }` | Custom query or loadRelationCountAndMap |

## ✨ Vantaggi TypeORM

1. **Domain Model nativo**: Le entity sono già classi con business logic
2. **No doppio layer**: Non serve Repository + Entity separati
3. **Decorators**: Configurazione direttamente nelle entity
4. **Active Record opzionale**: Metodi direttamente sulle entity
5. **Supporto NestJS nativo**: `@InjectRepository(Entity)`

## 🔄 Nuovo Seed File

Creare `src/seeds/stores.seed.ts`:

```typescript
import { DataSource } from 'typeorm';
import { Store } from '../entities/store.entity';

export async function seedStores(dataSource: DataSource) {
  const storeRepository = dataSource.getRepository(Store);

  const stores = [
    { name: 'Amazon IT', domain: 'amazon.it', isActive: true },
    { name: 'eBay IT', domain: 'ebay.it', isActive: true },
  ];

  for (const storeData of stores) {
    const exists = await storeRepository.findOne({
      where: { name: storeData.name }
    });

    if (!exists) {
      await storeRepository.save(storeData);
    }
  }
}
```

## 🎯 Testing

Dopo la migrazione:
1. `npm run build` - Verifica compilazione
2. `npm run start:dev` - Verifica avvio
3. Test API endpoints
4. Verifica database creation

La migrazione a TypeORM è stata iniziata. Continua aggiornando i moduli rimanenti seguendo il pattern mostrato.

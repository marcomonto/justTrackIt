# justTrackIt

Un'applicazione full-stack moderna per tracciare qualsiasi item che vuoi comprare. Con autenticazione JWT, design minimalista stile Nothing, e gestione completa degli item personalizzabili.

## Struttura del Progetto

```
justTrackIt/
├── backend/              # NestJS backend API
│   ├── src/
│   │   ├── auth/        # Modulo Auth (JWT, cookies)
│   │   ├── items/       # Modulo Items (CRUD protetto)
│   │   ├── prisma.service.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
└── frontend/             # Vue 3 frontend + Tailwind CSS
    ├── src/
    │   ├── views/       # Login, Register, Items
    │   ├── stores/      # Pinia stores (auth, items)
    │   ├── services/    # API services
    │   └── types/       # TypeScript types
    └── package.json
```

## Tech Stack

### Backend
- **NestJS** - Framework Node.js progressivo
- **Prisma ORM** - Database toolkit
- **SQLite** - Database leggero
- **JWT** - JSON Web Tokens per autenticazione
- **Passport** - Middleware autenticazione
- **bcrypt** - Hash password sicuro
- **cookie-parser** - Gestione cookie HTTP-only
- **class-validator** - Validazione DTO

### Frontend
- **Vue 3** (Composition API)
- **TypeScript**
- **Tailwind CSS** - Utility-first CSS framework
- **Pinia** - State management moderno
- **Vue Router** - Routing con navigation guards
- **Axios** - HTTP client con cookie support

## Funzionalità

### Autenticazione
- Registrazione utente con email e password
- Login con credenziali
- JWT memorizzato in **cookie HTTP-only** (più sicuro)
- Logout con clear cookie
- Route guards per proteggere pagine
- Sessioni persistenti (7 giorni)

### Gestione Items
- Aggiungere qualsiasi tipo di item (non solo libri!)
- Campi personalizzabili: nome, descrizione, immagine, prezzo, link
- Filtri per stato (da comprare, wishlist, acquistato)
- Priorità (urgente, normale, bassa)
- Categorie personalizzate
- Note personali
- Rating 0-5 stelle
- **Isolamento dati**: ogni utente vede solo i propri items

### UI/UX
- Design minimalista stile **Nothing Phone**
- Grid responsive (1-2-3-4 colonne)
- Card con hover effects
- Modal per aggiunta item
- Loading states
- Error handling con messaggi user-friendly

## Setup e Installazione

### Prerequisiti
- Node.js 18+
- npm o yarn

### Backend

1. Entra nella cartella backend:
```bash
cd backend
```

2. Installa le dipendenze:
```bash
npm install
```

3. Il database SQLite è già configurato. Per ricrearlo:
```bash
npx prisma migrate dev
```

4. **(Opzionale)** Configura variabili ambiente in `.env`:
```env
JWT_SECRET=your-super-secret-key-change-me
DATABASE_URL="file:./dev.db"
PORT=3000
```

5. Avvia il server backend:
```bash
npm run start:dev
```

Backend disponibile su **`http://localhost:3000`**

### Frontend

1. Entra nella cartella frontend:
```bash
cd frontend
```

2. Installa le dipendenze:
```bash
npm install
```

3. Avvia il dev server:
```bash
npm run dev
```

Frontend disponibile su **`http://localhost:5173`**

## API Endpoints

### Auth

- `POST /api/auth/register` - Registra nuovo utente
- `POST /api/auth/login` - Login utente
- `POST /api/auth/logout` - Logout (clear cookie)
- `GET /api/auth/me` - Ottieni dati utente autenticato

### Items (protetti con JWT)

- `GET /api/items` - Ottieni tutti gli items dell'utente
- `GET /api/items?filter=to_buy` - Filtra per stato
- `GET /api/items/:id` - Ottieni item specifico
- `POST /api/items` - Crea nuovo item
- `PATCH /api/items/:id` - Aggiorna item
- `DELETE /api/items/:id` - Elimina item
- `GET /api/items/stats` - Statistiche utente

### Esempio Richieste

**Register:**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Mario Rossi"
}
```

**Create Item:**
```json
POST /api/items
{
  "name": "iPhone 15 Pro",
  "description": "Smartphone premium Apple",
  "price": 1199.99,
  "imageUrl": "https://...",
  "link": "https://store.apple.com/...",
  "category": "Tech",
  "status": "wishlist",
  "priority": "urgent",
  "notes": "Aspetto offerte Black Friday"
}
```

## Modello Database

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // bcrypt hash
  name      String
  items     Item[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Item {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  imageUrl    String?
  price       Float?
  link        String?
  category    String?
  status      String   @default("to_buy")
  priority    String   @default("normal")
  notes       String?
  rating      Int?     @default(0)
  userId      Int
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Sicurezza

- Password hashate con **bcrypt** (10 rounds)
- JWT in **cookie HTTP-only** (no XSS attacks)
- **SameSite=lax** cookie policy
- CORS configurato correttamente
- Validazione input con class-validator
- Authorization checks su ogni endpoint items
- Isolamento dati utente (row-level security)

## Sviluppo

### Backend Commands

```bash
npm run start:dev    # Dev mode con hot reload
npm run build        # Build produzione
npm run start:prod   # Avvia build produzione
npx prisma studio    # GUI database
npx prisma migrate dev --name <nome>  # Nuova migrazione
```

### Frontend Commands

```bash
npm run dev          # Dev server Vite
npm run build        # Build produzione
npm run preview      # Preview build produzione
npm run type-check   # TypeScript check
npm run lint         # ESLint
```

## Design System

Ispirato a **Nothing Phone** design:
- Palette: Bianco/Nero/Grigi
- Typography: Sans-serif pulita
- Spacing consistente (4px grid)
- Border radius moderati (8-12px)
- Ombre leggere su hover
- Transizioni fluide (300ms)

## Roadmap Future

- [ ] Upload immagini item (Cloudinary/S3)
- [ ] Ricerca e ordinamento avanzati
- [ ] Export dati (CSV, PDF)
- [ ] Statistiche avanzate con grafici
- [ ] Condivisione wishlist pubbliche
- [ ] Notifiche push
- [ ] Dark mode
- [ ] PWA / Mobile app
- [ ] Integrazione API Amazon per prezzi live
- [ ] Social sharing

## Note Tecniche

- Database: `backend/prisma/dev.db`
- Cookie JWT: httpOnly, 7 giorni TTL
- CORS: `http://localhost:5173`
- Prisma Client generato in: `backend/generated/prisma`
- Tailwind config: JIT mode, forms plugin

## Troubleshooting

**Backend non parte:**
- Verifica che port 3000 sia libero
- Rigenera Prisma client: `npx prisma generate`

**Frontend errore CORS:**
- Verifica che backend sia su port 3000
- Controlla `withCredentials: true` in axios

**Cookie non salvato:**
- Usa `http://localhost` non `127.0.0.1`
- Verifica che `sameSite` sia corretto

## Licenza

MIT

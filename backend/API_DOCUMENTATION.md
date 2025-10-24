# JustTrackIt - API Documentation

## Overview
JustTrackIt è un sistema di price tracking che monitora automaticamente i prezzi dei prodotti su diversi store online e invia notifiche quando il prezzo scende.

## Architettura

### Moduli Implementati

1. **Stores** - Gestione degli store supportati
2. **Scrapers** - Web scraping per estrarre prezzi
3. **TrackedItems** - Prodotti tracciati dagli utenti
4. **PriceHistory** - Storico dei prezzi
5. **Alerts** - Sistema di alert personalizzati
6. **Notifications** - Sistema di notifiche email
7. **Scheduler** - Cron jobs per check automatici

---

## API Endpoints

### Authentication
Tutti gli endpoint richiedono autenticazione JWT (tranne GET /stores).

Headers richiesti:
```
Authorization: Bearer <jwt_token>
```

---

## 📦 Stores

### GET /stores
Ottieni lista degli store supportati

**Query Parameters:**
- `activeOnly` (boolean, optional) - Mostra solo store attivi

**Response:**
```json
[
  {
    "id": 1,
    "name": "Amazon IT",
    "domain": "amazon.it",
    "logoUrl": "https://...",
    "isActive": true,
    "scrapeType": "html",
    "minDelayMs": 5000
  }
]
```

### POST /stores
Crea un nuovo store (admin only)

**Body:**
```json
{
  "name": "MediaWorld",
  "domain": "mediaworld.it",
  "isActive": true,
  "scrapeType": "html",
  "minDelayMs": 5000
}
```

---

## 🔍 Tracked Items

### POST /api/items/tracked
Aggiungi un prodotto da trackare

**Body:**
```json
{
  "productUrl": "https://amazon.it/product/...",
  "targetPrice": 99.99,
  "category": "Electronics",
  "notes": "Voglio comprarlo quando scende sotto 100€"
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "storeId": 1,
  "name": "PlayStation 5",
  "productUrl": "https://amazon.it/...",
  "currentPrice": 549.99,
  "targetPrice": 99.99,
  "currency": "EUR",
  "isTracking": true,
  "lastCheckedAt": "2025-10-22T23:00:00Z",
  "store": {
    "name": "Amazon IT",
    "domain": "amazon.it"
  }
}
```

### GET /api/items/tracked
Ottieni tutti i prodotti tracciati

**Query Parameters:**
- `filter` (string, optional) - Filtra per status: `tracking`, `paused`, `purchased`

**Response:**
```json
[
  {
    "id": 1,
    "name": "PlayStation 5",
    "currentPrice": 549.99,
    "targetPrice": 499.99,
    "isTracking": true,
    "store": {...},
    "_count": {
      "priceHistory": 15
    }
  }
]
```

### GET /api/items/tracked/:id
Ottieni dettagli di un singolo prodotto tracciato

**Response:**
```json
{
  "id": 1,
  "name": "PlayStation 5",
  "currentPrice": 549.99,
  "targetPrice": 499.99,
  "store": {...},
  "priceHistory": [
    {
      "id": 1,
      "price": 549.99,
      "checkedAt": "2025-10-22T23:00:00Z"
    }
  ],
  "alerts": [...]
}
```

### GET /api/items/tracked/:id/history
Ottieni lo storico completo dei prezzi

**Response:**
```json
[
  {
    "id": 1,
    "itemId": 1,
    "price": 549.99,
    "currency": "EUR",
    "isAvailable": true,
    "checkedAt": "2025-10-22T23:00:00Z"
  },
  {
    "id": 2,
    "price": 529.99,
    "checkedAt": "2025-10-23T05:00:00Z"
  }
]
```

### POST /api/items/tracked/:id/refresh
Aggiorna manualmente il prezzo di un prodotto

**Response:**
```json
{
  "id": 1,
  "currentPrice": 529.99,
  "lastCheckedAt": "2025-10-23T10:30:00Z"
}
```

### PATCH /api/items/tracked/:id
Aggiorna le impostazioni di un prodotto tracciato

**Body:**
```json
{
  "targetPrice": 450.00,
  "isTracking": true,
  "status": "tracking",
  "notes": "Updated notes"
}
```

### DELETE /api/items/tracked/:id
Rimuovi un prodotto dal tracking

### GET /api/items/tracked/stats
Statistiche sui prodotti tracciati

**Response:**
```json
{
  "totalItems": 15,
  "activeTracking": 12,
  "potentialSavings": 234.50
}
```

---

## 🔔 Alerts

### POST /alerts
Crea un nuovo alert

**Body:**
```json
{
  "itemId": 1,
  "type": "target_reached",
  "triggerPrice": 449.99
}
```

**Alert Types:**
- `target_reached` - Quando il prezzo raggiunge il target (richiede `triggerPrice`)
- `price_drop` - Ogni volta che il prezzo scende
- `percentage_drop` - Quando scende di una certa % (richiede `percentageDrop`)
- `back_in_stock` - Quando torna disponibile

**Example: Percentage Drop Alert**
```json
{
  "itemId": 1,
  "type": "percentage_drop",
  "percentageDrop": 20
}
```

### GET /alerts
Ottieni tutti gli alert dell'utente

**Query Parameters:**
- `activeOnly` (boolean, optional)

### GET /alerts/item/:itemId
Ottieni tutti gli alert per uno specifico item

### PATCH /alerts/:id
Aggiorna un alert

**Body:**
```json
{
  "isActive": false,
  "triggerPrice": 399.99
}
```

### DELETE /alerts/:id
Elimina un alert

---

## 📧 Notifications

### GET /notifications
Ottieni le notifiche dell'utente

**Query Parameters:**
- `limit` (number, optional, default: 50)

**Response:**
```json
[
  {
    "id": 1,
    "type": "price_drop",
    "channel": "email",
    "status": "sent",
    "title": "Price Alert",
    "message": "PlayStation 5 price dropped from 549.99 to 529.99 EUR (-3.64%)",
    "sentAt": "2025-10-23T05:05:00Z",
    "alert": {...}
  }
]
```

### GET /notifications/unread-count
Ottieni il numero di notifiche non lette

---

## ⚙️ Configurazione

### Environment Variables (.env)

```bash
# Database
DATABASE_URL="file:./dev.db"

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@justtrackit.com
```

### Configurazione Gmail
Per usare Gmail come provider email:

1. Abilita "2-Step Verification" sul tuo account Google
2. Genera un "App Password" da: https://myaccount.google.com/apppasswords
3. Usa la App Password nel file .env

---

## 🤖 Automazione

### Cron Jobs

Il sistema esegue automaticamente:

1. **Price Check** (ogni 6 ore)
   - Controlla i prezzi di tutti gli item con `isTracking=true`
   - Salva i nuovi prezzi in PriceHistory
   - Trigger degli alert se le condizioni sono soddisfatte

2. **Send Notifications** (ogni 5 minuti)
   - Invia le notifiche email in pending
   - Gestisce retry automatici in caso di errore

---

## 🛠️ Sviluppo

### Comandi Utili

```bash
# Build
npm run build

# Development
npm run start:dev

# Seed database con store predefiniti
npm run seed

# Migrations
npx prisma migrate dev
npx prisma generate

# Tests
npm run test
npm run test:e2e
```

### Store Supportati (dopo seed)

- Amazon IT (amazon.it)
- Amazon (amazon.com)
- eBay IT (ebay.it)
- eBay (ebay.com)

---

## 📊 Flusso di Lavoro

1. **Utente aggiunge un prodotto:**
   ```
   POST /api/items/tracked
   → Sistema riconosce lo store dall'URL
   → Scraper estrae prezzo iniziale
   → Crea TrackedItem + PriceHistory entry
   ```

2. **Scheduler check automatico (ogni 6h):**
   ```
   Cron job → Per ogni item tracciato
   → Scraper estrae prezzo corrente
   → Salva in PriceHistory
   → Confronta con targetPrice
   → Se alert triggered → Crea Notification
   ```

3. **Sistema notifiche (ogni 5min):**
   ```
   Cron job → Recupera notifiche pending
   → Invia email usando template Handlebars
   → Marca come sent/failed
   ```

---

## 🔧 Estensibilità

### Aggiungere un nuovo Store

1. Crea uno scraper in `src/scrapers/adapters/`:
```typescript
export class CustomStoreScraper implements Scraper {
  canHandle(url: string): boolean {
    return url.includes('customstore.com');
  }

  async scrape(url: string): Promise<ScraperResult> {
    // Implementa logica scraping
  }
}
```

2. Registra nel `ScrapersModule`

3. Aggiungi store al database via seed o API

---

## 📝 Note

- Il sistema usa **rate limiting** per rispettare i limiti degli store (5 secondi tra richieste allo stesso dominio)
- I prezzi sono salvati con timestamp per analytics future
- Gli alert hanno un cooldown per evitare spam di notifiche
- Le email usano template Handlebars personalizzabili

---

## 🚀 Prossimi Step Consigliati

1. Implementare cache Redis per ottimizzare performance
2. Aggiungere queue system (Bull) per scraping asincrono
3. Dashboard analytics con grafici prezzi
4. Supporto push notifications
5. Export storico prezzi (CSV/JSON)
6. Browser extension per aggiungere prodotti

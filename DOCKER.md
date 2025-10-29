# Docker Setup for JustTrackIt

Questa guida ti aiuterà a configurare e avviare l'applicazione JustTrackIt utilizzando Docker per l'ambiente di sviluppo.

## Prerequisiti

- [Docker](https://docs.docker.com/get-docker/) installato (versione 20.10 o superiore)
- [Docker Compose](https://docs.docker.com/compose/install/) installato (versione 2.0 o superiore)

Verifica l'installazione:
```bash
docker --version
docker-compose --version
```

## Struttura dei File Docker

```
justTrackIt/
├── docker-compose.dev.yml      # Configurazione Docker Compose per sviluppo
├── backend/
│   ├── Dockerfile.dev          # Dockerfile per il backend (dev)
│   └── .dockerignore           # File da escludere dal build
├── frontend/
│   ├── Dockerfile.dev          # Dockerfile per il frontend (dev)
│   └── .dockerignore           # File da escludere dal build
└── DOCKER.md                   # Questa guida
```

## Avvio Rapido

### 1. Configurazione Variabili d'Ambiente

Crea un file `.env` nella root del progetto per le variabili d'ambiente sensibili:

```bash
# .env (nella root del progetto)
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

**Nota**: Per Gmail, dovrai creare una [App Password](https://myaccount.google.com/apppasswords) invece di usare la tua password normale.

### 2. Avvia i Container

```bash
# Dalla root del progetto
docker-compose -f docker-compose.dev.yml up
```

Oppure in background (detached mode):
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Accedi all'Applicazione

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api

## Comandi Utili

### Gestione Container

```bash
# Avvia i servizi
docker-compose -f docker-compose.dev.yml up

# Avvia in background
docker-compose -f docker-compose.dev.yml up -d

# Ferma i servizi
docker-compose -f docker-compose.dev.yml down

# Ferma e rimuovi volumi (attenzione: cancella il database!)
docker-compose -f docker-compose.dev.yml down -v

# Riavvia un servizio specifico
docker-compose -f docker-compose.dev.yml restart backend
docker-compose -f docker-compose.dev.yml restart frontend

# Visualizza i log
docker-compose -f docker-compose.dev.yml logs

# Segui i log in tempo reale
docker-compose -f docker-compose.dev.yml logs -f

# Log di un servizio specifico
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
```

### Build e Rebuild

```bash
# Build delle immagini
docker-compose -f docker-compose.dev.yml build

# Rebuild forzato (senza cache)
docker-compose -f docker-compose.dev.yml build --no-cache

# Build e avvio
docker-compose -f docker-compose.dev.yml up --build
```

### Esecuzione Comandi nei Container

```bash
# Accedi al container backend
docker-compose -f docker-compose.dev.yml exec backend sh

# Accedi al container frontend
docker-compose -f docker-compose.dev.yml exec frontend sh

# Esegui i test del backend
docker-compose -f docker-compose.dev.yml exec backend npm test

# Esegui i test di integrazione
docker-compose -f docker-compose.dev.yml exec backend npm run test:integration

# Esegui i test e2e
docker-compose -f docker-compose.dev.yml exec backend npm run test:e2e

# Installa nuove dipendenze (backend)
docker-compose -f docker-compose.dev.yml exec backend npm install nuova-dipendenza

# Installa nuove dipendenze (frontend)
docker-compose -f docker-compose.dev.yml exec frontend npm install nuova-dipendenza
```

### Migrazioni Database

```bash
# Esegui le migrazioni (se usi TypeORM)
docker-compose -f docker-compose.dev.yml exec backend npm run migration:run

# Seed del database
docker-compose -f docker-compose.dev.yml exec backend npm run seed
```

## Hot Reload

Entrambi i servizi (backend e frontend) supportano il **hot reload**:

- **Backend**: Quando modifichi i file in `backend/src`, NestJS rileverà automaticamente le modifiche e riavvierà il server.
- **Frontend**: Quando modifichi i file in `frontend/src`, Vite aggiornerà automaticamente il browser.

## Volumi e Persistenza Dati

Il docker-compose usa i seguenti volumi:

- **backend-node-modules**: Volumi per node_modules del backend (evita conflitti con l'host)
- **frontend-node-modules**: Volumi per node_modules del frontend
- **Database**: `./backend/justtrack-it.db` è montato direttamente dall'host per persistere i dati

**Attenzione**: Il database SQLite è memorizzato localmente in `backend/justtrack-it.db`. Se elimini questo file, perderai tutti i dati.

## Health Check

Il backend ha un health check configurato che verifica:
- Il server è in ascolto sulla porta 3000
- Il servizio risponde alle richieste HTTP

Visualizza lo stato:
```bash
docker-compose -f docker-compose.dev.yml ps
```

## Troubleshooting

### I container non si avviano

1. Verifica che le porte 3000 e 5173 non siano già in uso:
   ```bash
   lsof -i :3000
   lsof -i :5173
   ```

2. Controlla i log per errori:
   ```bash
   docker-compose -f docker-compose.dev.yml logs
   ```

### Hot reload non funziona

1. Assicurati che i volumi siano montati correttamente:
   ```bash
   docker-compose -f docker-compose.dev.yml config
   ```

2. Riavvia i container:
   ```bash
   docker-compose -f docker-compose.dev.yml restart
   ```

### Problemi con node_modules

Se hai problemi con le dipendenze:

```bash
# Elimina i volumi e rebuilda
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

### Errori di permessi con SQLite

Se hai errori di permessi sul database:

```bash
# Cambia i permessi del file database
chmod 666 backend/justtrack-it.db
```

### Il backend non riesce a connettersi a servizi esterni

Assicurati che le variabili d'ambiente siano configurate correttamente nel file `.env` o nel docker-compose.dev.yml.

## Pulizia

### Rimuovi tutti i container e volumi

```bash
# Ferma e rimuovi container, network e volumi
docker-compose -f docker-compose.dev.yml down -v

# Rimuovi anche le immagini
docker-compose -f docker-compose.dev.yml down -v --rmi all
```

### Pulizia generale di Docker

```bash
# Rimuovi container, network, immagini e volumi non utilizzati
docker system prune -a --volumes
```

## Note di Sicurezza

⚠️ **Importante**: Questo setup è progettato solo per lo **sviluppo locale**.

Per produzione:
- Usa `Dockerfile` (senza `.dev`) con build ottimizzate
- Non esporre le porte direttamente
- Usa secret manager per le credenziali
- Configura SSL/TLS
- Usa un database più robusto (PostgreSQL, MySQL)
- Implementa un reverse proxy (nginx, traefik)

## Prossimi Passi

- Configura il file `.env` con le tue credenziali email
- Avvia i container con `docker-compose -f docker-compose.dev.yml up`
- Apri il browser su http://localhost:5173
- Inizia a sviluppare! 🚀

## Supporto

Per problemi o domande:
- Controlla i log: `docker-compose -f docker-compose.dev.yml logs`
- Verifica lo stato dei container: `docker-compose -f docker-compose.dev.yml ps`
- Consulta la documentazione del backend in `backend/API_DOCUMENTATION.md`

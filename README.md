# 🚀 MENTRAI Prospecting App

AI-Powered B2B Prospecting Platform with Claude Integration

## ⚡ Quick Start

### Desarrollo Local (5 minutos)

#### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus API keys
npm run dev
```

#### 2. Frontend (en otra terminal)
```bash
cd frontend
npm install
npm run dev
```

Visita: http://localhost:5174

### Credenciales de Test
- Email: `test@test.com`
- Password: `Test123456`

---

## 🌐 Deployment (Monolito - Todo en Uno)

**El backend sirve tanto la API como el frontend compilado.**

### Deploy Rápido en Render

1. **Fork/Push este repo a tu GitHub**

2. **Click aquí**: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

3. **Configura las API Keys necesarias**:
   - `APOLLO_API_KEY` → [Apollo.io](https://apollo.io)
   - `ANTHROPIC_API_KEY` → [Anthropic Console](https://console.anthropic.com)
   - `BRAVE_API_KEY` → [Brave Search](https://brave.com/search/api/)

4. **Click "Create"** → Render hace todo automáticamente:
   - Crea la base de datos PostgreSQL
   - Instala dependencias del backend
   - Construye el frontend (npm run build)
   - Copia el frontend a backend/public/
   - Genera Prisma schemas
   - Deploya todo junto

Tu app estará en: `https://tu-app.onrender.com`

### Instrucciones Detalladas

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para:
- Deploy manual en Render
- Deploy en Railway
- Troubleshooting
- Variables de entorno completas

---

# 🚀 MENTRAI Prospecting App

AI-Powered B2B Prospecting Platform with Claude Integration

## ⚡ Quick Start

### Desarrollo Local (5 minutos)

#### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus API keys
npm run dev
```

#### 2. Frontend (en otra terminal)
```bash
cd frontend
npm install
npm run dev
```

Visita: http://localhost:5174

### Credenciales de Test
- Email: `test@test.com`
- Password: `Test123456`

---

## 🌐 Deployment (Monolito - Todo en Uno)

**El backend sirve tanto la API como el frontend compilado.**

### Deploy Rápido en Render

1. **Fork/Push este repo a tu GitHub**

2. **Click aquí**: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

3. **Configura las API Keys necesarias**:
   - `APOLLO_API_KEY` → [Apollo.io](https://apollo.io)
   - `ANTHROPIC_API_KEY` → [Anthropic Console](https://console.anthropic.com)
   - `BRAVE_API_KEY` → [Brave Search](https://brave.com/search/api/)

4. **Click "Create"** → Render hace todo automáticamente:
   - Crea la base de datos PostgreSQL
   - Instala dependencias del backend
   - Construye el frontend (npm run build)
   - Copia el frontend a backend/public/
   - Genera Prisma schemas
   - Deploya todo junto

Tu app estará en: `https://tu-app.onrender.com`

### Instrucciones Detalladas

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para:
- Deploy manual en Render
- Deploy en Railway
- Troubleshooting
- Variables de entorno completas

---

## ✨ Features

- 🤖 **AI-Powered Search**: Claude interpreta búsquedas en lenguaje natural
- 🎯 **Intelligent Scoring**: Sistema de scoring automático de prospectos (0-100)
- 📊 **Company Enrichment**: Integración con Apollo.io, Hunter.io, Clearbit
- 📋 **List Management**: Organiza prospectos en listas personalizadas
- 🔍 **Smart Filters**: Filtra por industria, tamaño, ubicación, seniority
- 📧 **Email Discovery**: Encuentra y verifica emails automáticamente
- 🚀 **Batch Operations**: Enriquecimiento masivo de prospectos

## 🛠 Tech Stack

**Frontend:**
- React 18 + Vite
- React Router DOM
- React Hook Form + Zod
- TailStack (Headless UI + Heroicons)
- Zustand (State)
- React Query
- Recharts

**Backend:**
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT Authentication
- Anthropic Claude API
- Apollo.io API
- Brave Search API
- Rate Limiting + Helmet

**Deployment:**
- Render (Monolito: Backend + Frontend)
- PostgreSQL (Render/Neon/Supabase)

## 📁 Project Structure

```
ProspectoMentrai/
├── backend/
│   ├── src/
│   │   ├── controllers/      # API controllers
│   │   ├── services/         # Business logic
│   │   │   ├── ai/          # Claude integration
│   │   │   ├── apollo/      # Apollo.io integration
│   │   │   └── prospecting/ # Scoring & ranking
│   │   ├── routes/          # Express routes
│   │   ├── middleware/      # Auth, errors, etc.
│   │   └── server.js        # Express app
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Seed data
│   ├── public/              # Frontend build (generado)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Routes/Pages
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API clients
│   │   ├── store/           # Zustand stores
│   │   └── main.jsx         # Entry point
│   └── package.json
│
├── DEPLOYMENT.md            # Deployment guide
├── render.yaml              # Render config
└── README.md
```

## 🔧 Environment Variables

### Backend (.env)

```bash
# Required
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
APOLLO_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
BRAVE_API_KEY=your-key

# Optional
HUNTER_API_KEY=your-key
CLEARBIT_API_KEY=your-key
```

Ver [.env.example](./backend/.env.example) para todas las variables.

## 🚀 Build & Deploy

### Build Local
```bash
cd backend
npm run build
```

Esto:
1. Instala frontend dependencies
2. Construye frontend (`npm run build`)
3. Copia `frontend/dist/` → `backend/public/`
4. Genera Prisma Client

### Deploy en Render
```bash
# Render ejecuta automáticamente:
npm run build  # Build frontend + Prisma
npm start      # Start Express server
```

## 🐛 Troubleshooting

### Backend no compila el frontend
```bash
cd backend
npm run build:frontend
```

### Frontend no encuentra la API
Verifica que en producción, `frontend/src/services/api.js` use `/api` (relativo), no `http://localhost:5000/api`.

### Prisma migrations no se aplican
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 500 en AI Search
Verifica que `ANTHROPIC_API_KEY` esté configurada correctamente en Render.

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para más troubleshooting.

## 📊 Monitoring

### Logs en Render
1. Dashboard → Tu servicio
2. Click "Logs"
3. Ver logs en tiempo real

### Health Check
```bash
curl https://tu-app.onrender.com/health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123,
  "environment": "production"
}
```

## 🔒 Security

- ✅ JWT Authentication con 7 días de expiración
- ✅ Helmet.js para headers de seguridad
- ✅ Rate limiting (100 req/15min por IP)
- ✅ CORS configurado para same-origin en producción
- ✅ Bcrypt para hash de passwords
- ✅ Input validation con Zod

## 📈 Performance

- ✅ Compression middleware
- ✅ Static file caching
- ✅ Database connection pooling
- ✅ Batch operations para enrichment
- ✅ React Query para caching frontend

## 🎯 Roadmap

- [ ] Email campaigns automation
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] API rate limiting por usuario
- [ ] Webhooks para eventos

## 📝 License

MIT

---

Hecho con ❤️ para MENTRAI
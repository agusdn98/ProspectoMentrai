# 🚀 Deployment Instructions - MENTRAI (Monolito)

Backend + Frontend en un solo deploy. El backend sirve la API y los archivos estáticos del frontend.

## 📋 Pre-requisitos

1. Cuenta en [Render](https://render.com) o [Railway](https://railway.app)
2. Base de datos PostgreSQL (puedes usar Render PostgreSQL o Supabase)
3. API Keys necesarias:
   - `APOLLO_API_KEY` (Apollo.io)
   - `ANTHROPIC_API_KEY` (Claude AI)
   - `BRAVE_API_KEY` (Brave Search)
   - `HUNTER_API_KEY` (Hunter.io - opcional)
   - `CLEARBIT_API_KEY` (Clearbit - opcional)

## 🎯 Opción 1: Deploy en Render (Recomendado)

### Paso 1: Crear PostgreSQL Database

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en "New +" → "PostgreSQL"
3. Configura:
   - **Name**: `mentrai-db`
   - **Database**: `mentrai_prospecting`
   - **User**: (autogenerado)
   - **Region**: Oregon (o la más cercana)
   - **Plan**: Free (para testing) o Starter ($7/mes)
4. Click "Create Database"
5. **Copia la Internal Database URL** (empieza con `postgresql://`)

### Paso 2: Crear Web Service

1. En Render Dashboard, click "New +" → "Web Service"
2. Conecta tu repositorio de GitHub
3. Configura el servicio:
   - **Name**: `mentrai-app`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (para testing) o Starter ($7/mes)

### Paso 3: Configurar Variables de Entorno

En la sección "Environment", agrega estas variables:

```bash
# Node Environment
NODE_ENV=production

# Database (usa la Internal URL de tu PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database

# JWT
JWT_SECRET=tu-secret-key-super-segura-cambiala-en-produccion
JWT_EXPIRES_IN=7d

# Apollo.io
APOLLO_API_KEY=tu-apollo-api-key
APOLLO_BASE_URL=https://api.apollo.io/api/v1
APOLLO_RATE_LIMIT_PER_MINUTE=120

# Anthropic Claude
ANTHROPIC_API_KEY=tu-anthropic-api-key
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Brave Search
BRAVE_API_KEY=tu-brave-api-key

# Hunter.io (opcional)
HUNTER_API_KEY=tu-hunter-api-key

# Clearbit (opcional)
CLEARBIT_API_KEY=tu-clearbit-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Port (Render lo asigna automáticamente, pero por si acaso)
PORT=5000
```

### Paso 4: Deploy!

1. Click "Create Web Service"
2. Render automáticamente:
   - Clona el repo
   - Ejecuta `npm run build` (instala frontend, lo compila, copia a public/, genera Prisma)
   - Ejecuta `npm start`
   - Corre las migraciones de Prisma

3. Una vez completado, tu app estará disponible en:
   ```
   https://mentrai-app.onrender.com
   ```

### Paso 5: Correr Migraciones (Primera vez)

Render debería correr las migraciones automáticamente con Prisma, pero si no:

1. Ve a tu Web Service en Render
2. Click en "Shell" (terminal)
3. Ejecuta:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

## 🎯 Opción 2: Deploy en Railway

### Paso 1: Crear Proyecto

1. Ve a [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repositorio

### Paso 2: Agregar PostgreSQL

1. Click "+ New" → "Database" → "PostgreSQL"
2. Espera a que se provisione
3. Railway automáticamente crea la variable `DATABASE_URL`

### Paso 3: Configurar el Servicio

1. Click en tu servicio de GitHub
2. Ve a "Settings":
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### Paso 4: Variables de Entorno

Agrega las mismas variables que en Render (Railway ya tiene `DATABASE_URL`)

### Paso 5: Deploy

Railway hace deploy automáticamente. Tu app estará en:
```
https://tu-proyecto.up.railway.app
```

## ✅ Verificación del Deploy

Una vez deployado, verifica:

1. **Health Check**:
   ```
   GET https://tu-app.onrender.com/health
   ```
   Debería retornar:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "uptime": 123,
     "environment": "production"
   }
   ```

2. **Frontend**: 
   - Visita `https://tu-app.onrender.com`
   - Deberías ver la landing page de MENTRAI

3. **Login**:
   - Ve a `/login`
   - Usa las credenciales de test: `test@test.com` / `Test123456`

4. **AI Finder**:
   - Ve a `/ai-finder`
   - Prueba una búsqueda: "CTOs in fintech companies in San Francisco"

## 🔧 Troubleshooting

### Build falla en "npm run build"

- **Problema**: No encuentra el frontend
- **Solución**: Verifica que `Root Directory` sea `backend` y que el repo tenga la carpeta `frontend` al lado

### Frontend no carga (404 en assets)

- **Problema**: Los archivos no se copiaron a `public/`
- **Solución**: Conéctate al Shell y ejecuta:
  ```bash
  npm run build:frontend
  ```

### Error de conexión a database

- **Problema**: `DATABASE_URL` incorrecta
- **Solución**: 
  - Usa la **Internal URL** (no la External)
  - Verifica que tenga el formato: `postgresql://user:pass@host:port/db`
  - Agrega `?sslmode=require` al final si es necesario

### AI Search no funciona

- **Problema**: Falta `ANTHROPIC_API_KEY`
- **Solución**: 
  - Verifica que la variable esté configurada
  - Obtén una API key en https://console.anthropic.com

### Prisma migrations no se aplicaron

- Conéctate al Shell y ejecuta:
  ```bash
  npx prisma migrate deploy
  npx prisma generate
  ```

## 📊 Monitoreo

### Logs en Render
1. Ve a tu Web Service
2. Click en "Logs"
3. Verás logs en tiempo real

### Logs en Railway
1. Ve a tu servicio
2. Click en "Deployments" → Latest deployment → "View Logs"

## 🔄 Updates

Para deployar cambios:

1. **Commit y push a GitHub**:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. Render/Railway detecta el push y hace auto-deploy

## 💰 Costos Estimados

### Render Free Tier
- Web Service: Free (750 hrs/mes, duerme después de 15 min inactividad)
- PostgreSQL: Free (90 días trial, luego $7/mes)
- **Total**: $0 (trial) → $7/mes

### Render Paid (Recomendado para producción)
- Web Service Starter: $7/mes (siempre activo)
- PostgreSQL Starter: $7/mes
- **Total**: $14/mes

### Railway
- Pay-as-you-go: ~$5-20/mes dependiendo uso
- Sin free tier permanente, pero créditos gratuitos al inicio

## 🎉 ¡Listo!

Tu app MENTRAI está deployada con:
- ✅ Frontend (React + Vite)
- ✅ Backend (Express + Node.js)
- ✅ Database (PostgreSQL)
- ✅ AI Search (Claude)
- ✅ Apollo.io Integration
- ✅ Todo en una sola URL

**URL final**: `https://tu-app.onrender.com`

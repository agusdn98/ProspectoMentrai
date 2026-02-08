# 🚀 Deploy con Cloudflare Pages + Railway

## 🎯 Arquitectura

- **Frontend** → Cloudflare Pages (gratis, CDN global)
- **Backend** → Railway (Node.js + Express + PostgreSQL)

**¿Por qué no todo en Cloudflare?** 
Cloudflare Workers no puede ejecutar Express/Prisma/PostgreSQL directamente. Necesitamos un servidor real para el backend.

---

## 📋 Parte 1: Deploy del Backend en Railway

### 1️⃣ Crear cuenta en Railway

1. Ve a https://railway.app
2. Sign up con GitHub
3. Click "New Project"

### 2️⃣ Crear PostgreSQL Database

1. Click "New" → "Database" → "Add PostgreSQL"
2. Espera a que se provisione
3. Railway automáticamente crea la variable `DATABASE_URL`

### 3️⃣ Crear servicio del Backend

1. Click "New" → "GitHub Repo" → Selecciona tu repo
2. Click en el servicio recién creado
3. Ve a "Settings":
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Watch Paths**: `/backend/**`

### 4️⃣ Configurar Variables de Entorno

Railway ya tiene `DATABASE_URL`. Agrega el resto:

```bash
NODE_ENV=production

# JWT
JWT_SECRET=cambia-esto-por-algo-super-secreto-random-123456
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

# CORS - se actualizará después con la URL de Cloudflare
FRONTEND_URL=http://localhost:5174

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5️⃣ Obtener la URL del Backend

1. Ve a "Settings" → "Networking" → "Public Networking"
2. Copia la URL (ejemplo: `https://mentrai-backend-production.up.railway.app`)
3. **GUARDA ESTA URL** - la necesitarás para Cloudflare

---

## 📋 Parte 2: Deploy del Frontend en Cloudflare Pages

### 1️⃣ Preparar el Frontend

1. Abre `frontend/_redirects` y actualiza:
   ```
   /api/*  https://TU-BACKEND-RAILWAY.up.railway.app/api/:splat  200
   /*      /index.html  200
   ```
   **👆 Reemplaza con tu URL de Railway del paso anterior**

2. Commit los cambios:
   ```bash
   git add .
   git commit -m "Configure Cloudflare Pages"
   git push
   ```

### 2️⃣ Crear proyecto en Cloudflare Pages

1. Ve a https://dash.cloudflare.com
2. Click "Workers & Pages" → "Create application" → "Pages" → "Connect to Git"
3. Autoriza Cloudflare a acceder a tu GitHub
4. Selecciona tu repositorio

### 3️⃣ Configurar el Build

```
Project name: mentrai-app
Production branch: main
Framework preset: Vite
Root directory: frontend

Build command: npm run build
Build output directory: dist

Environment variables:
VITE_API_URL=/api
```

**IMPORTANTE**: `VITE_API_URL=/api` (relativo, no absoluto) - Cloudflare usará `_redirects` para redirigir a Railway.

### 4️⃣ Deploy!

1. Click "Save and Deploy"
2. Cloudflare builds automáticamente
3. Espera 2-5 minutos

Tu frontend estará en: `https://mentrai-app.pages.dev`

---

## 📋 Parte 3: Conectar Frontend con Backend

### 1️⃣ Actualizar CORS en Railway

1. Ve a tu proyecto de Railway
2. Edita la variable `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://mentrai-app.pages.dev,http://localhost:5174
   ```
   **👆 Usa tu URL real de Cloudflare Pages**

2. Redeploy automático se dispara

### 2️⃣ Verificar que funciona

1. Visita `https://mentrai-app.pages.dev`
2. Ve a `/login`
3. Usa: `test@test.com` / `Test123456`
4. Si funciona, **¡TODO LISTO!** 🎉

---

## 🎯 Verificación Completa

### Backend (Railway)
```bash
# Health check
curl https://tu-backend.up.railway.app/health

# Debería retornar:
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123,
  "environment": "production"
}
```

### Frontend (Cloudflare Pages)
1. Visita `https://tu-app.pages.dev`
2. Landing page carga ✅
3. Login funciona ✅
4. AI Finder funciona ✅
5. Dashboard muestra datos ✅

---

## 🔄 Actualizaciones

### Actualizar Backend
```bash
# Haz cambios en backend/
git add backend/
git commit -m "Update backend"
git push
# Railway detecta y redeploya automáticamente
```

### Actualizar Frontend
```bash
# Haz cambios en frontend/
git add frontend/
git commit -m "Update frontend"
git push
# Cloudflare detecta y redeploya automáticamente
```

---

## 💰 Costos

| Servicio | Plan | Costo |
|----------|------|-------|
| **Cloudflare Pages** | Free | $0/mes |
| **Railway Starter** | PostgreSQL + Web Service | ~$5-10/mes ([uso real](https://railway.app/pricing)) |
| **Total** | | **$5-10/mes** |

**Railway Free Trial**: $5 de crédito gratis al empezar.

**Ventajas vs Render**:
- ✅ Más barato ($5-10 vs $14)
- ✅ Frontend en CDN global ultra rápido
- ✅ Railway no duerme (Render Free sí)
- ✅ Deploy más rápido

---

## 🐛 Troubleshooting

### ❌ CORS Error en frontend

**Problema**: Frontend no puede llamar al backend.

**Solución**:
1. Verifica que `FRONTEND_URL` en Railway incluya tu URL de Cloudflare
2. Redeploy el backend en Railway

### ❌ 404 en /api/*

**Problema**: `_redirects` no funciona.

**Solución**:
1. Verifica que `frontend/public/_redirects` exista
2. Verifica que la URL de Railway sea correcta
3. Redeploy en Cloudflare Pages

### ❌ Build falla en Cloudflare

**Problema**: Error en `npm run build`.

**Solución**:
1. Verifica que `Root directory` sea `frontend`
2. Verifica que `Build output directory` sea `dist`
3. Revisa los logs de build

### ❌ 500 Internal Server Error

**Problema**: Backend crashea.

**Solución**:
1. Ve a Railway → Tu servicio → "Observability" → "Logs"
2. Busca el error exacto
3. Verifica variables de entorno (especialmente `DATABASE_URL`)

---

## 🔒 Seguridad en Producción

### Variables de Entorno Sensibles

**NUNCA** commites `.env` al repo. Solo `.env.example`.

### Generar JWT_SECRET seguro

```bash
# Genera una clave random:
openssl rand -base64 32
# Copia el resultado y úsalo como JWT_SECRET
```

### CORS Correcto

Solo permite tu dominio de Cloudflare:
```bash
FRONTEND_URL=https://tu-app.pages.dev
```

---

## 📊 Monitoring

### Railway Logs
1. Railway → Tu servicio → "Observability"
2. Ver logs en tiempo real
3. Configurar alertas (plan Pro)

### Cloudflare Analytics
1. Cloudflare Pages → Tu proyecto → "Analytics"
2. Ver tráfico, requests, etc.

---

## ✅ Checklist Final

- [ ] Backend deployado en Railway
- [ ] PostgreSQL creada y conectada
- [ ] Variables de entorno configuradas en Railway
- [ ] Backend responde a `/health`
- [ ] URL del backend copiada
- [ ] `_redirects` actualizado con URL de Railway
- [ ] Cambios committed y pushed
- [ ] Frontend deployado en Cloudflare Pages
- [ ] `FRONTEND_URL` actualizada en Railway
- [ ] Login funciona en producción
- [ ] AI Finder funciona con Claude

---

## 🎉 ¡Listo!

Tu app está en producción:

- 🌐 **Frontend**: `https://tu-app.pages.dev`
- 🔧 **Backend**: `https://tu-backend.up.railway.app`
- 💾 **Database**: PostgreSQL en Railway

Stack completo:
- ✅ React + Vite (Cloudflare CDN)
- ✅ Express + Node.js (Railway)
- ✅ PostgreSQL (Railway)
- ✅ Claude AI
- ✅ Apollo.io
- ✅ Costos: $5-10/mes

**Ultra rápido + Ultra barato** 🚀

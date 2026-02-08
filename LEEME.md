# 🚀 MENTRAI - Deploy Todo en Uno

## ✅ Qué se configuró

**Backend + Frontend juntos** → El backend sirve la API y el frontend compilado en una sola URL.

## 📋 Pasos para Deploy en Render

### 1️⃣ Crear cuenta en Render

Ve a https://render.com y crea una cuenta gratis (usa GitHub login).

---

### 2️⃣ Crear Database PostgreSQL

1. En el Dashboard de Render, click **"New +"** → **"PostgreSQL"**
2. Configura:
   - **Name**: `mentrai-db`
   - **Database**: `mentrai_prospecting`
   - **Region**: Oregon (o la más cercana)
   - **Plan**: **Starter ($7/mes)** o Free (solo por 90 días)
3. Click **"Create Database"**
4. Espera a que esté "Available"
5. **IMPORTANTE**: Copia la **Internal Database URL** (empieza con `postgresql://...`)

---

### 3️⃣ Crear Web Service

1. En Dashboard, click **"New +"** → **"Web Service"**
2. Click **"Build and deploy from a Git repository"** → **"Next"**
3. Conecta tu repositorio de GitHub (este repo)
4. Configura:
   - **Name**: `mentrai-app` (o el nombre que quieras)
   - **Region**: Same as database (Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend` ← **IMPORTANTE**
   - **Runtime**: Node
   - **Build Command**: `npm run build` ← **Ya está en package.json**
   - **Start Command**: `npm start` ← **Ya está en package.json**
   - **Plan**: **Starter ($7/mes)** o Free

---

### 4️⃣ Configurar Variables de Entorno

En la sección **"Environment"**, agrega estas variables:

```bash
NODE_ENV=production

# Database (pega la Internal URL que copiaste antes)
DATABASE_URL=postgresql://user:password@host/database-internal

# JWT (genera una clave secreta larga y random)
JWT_SECRET=cambia-esto-por-una-clave-super-secreta-123456789
JWT_EXPIRES_IN=7d

# Apollo.io (obtén tu API key en apollo.io)
APOLLO_API_KEY=tu-apollo-api-key-aqui
APOLLO_BASE_URL=https://api.apollo.io/api/v1
APOLLO_RATE_LIMIT_PER_MINUTE=120

# Anthropic Claude (obtén tu API key en console.anthropic.com)
ANTHROPIC_API_KEY=tu-anthropic-api-key-aqui
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Brave Search (obtén tu API key en brave.com/search/api/)
BRAVE_API_KEY=tu-brave-api-key-aqui

# Hunter.io (OPCIONAL - para verificar emails)
HUNTER_API_KEY=tu-hunter-api-key-aqui

# Clearbit (OPCIONAL - para enriquecer empresas)
CLEARBIT_API_KEY=tu-clearbit-api-key-aqui

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Cómo obtener las API Keys:**

- **APOLLO_API_KEY**: 
  1. Ve a https://apollo.io (crea cuenta gratis)
  2. Settings → Integrations → API → Create Master Key
  
- **ANTHROPIC_API_KEY**: 
  1. Ve a https://console.anthropic.com (crea cuenta)
  2. API Keys → Create Key
  
- **BRAVE_API_KEY**: 
  1. Ve a https://brave.com/search/api/
  2. Sign up → Get API Key

---

### 5️⃣ Deploy!

1. Click **"Create Web Service"**
2. Render automáticamente:
   - Clona tu repo
   - Instala dependencias del backend
   - **Construye el frontend** (npm run build:frontend)
   - Copia los archivos compilados a `backend/public/`
   - Genera Prisma schemas
   - Arranca el servidor

3. **Espera 5-10 minutos** (el primer deploy tarda)

4. Cuando veas **"Live"** en verde, tu app está lista! 🎉

---

### 6️⃣ Verificar que funciona

1. Click en la URL de tu servicio (algo como `https://mentrai-app.onrender.com`)
2. Deberías ver la landing page de MENTRAI
3. Ve a `/login` y prueba:
   - Email: `test@test.com`
   - Password: `Test123456`
4. Si el login funciona, **TODO ESTÁ OK!** ✅

---

## 🔧 Troubleshooting

### ❌ Build falla: "Cannot find module"

**Problema**: No se instalaron las dependencias del frontend.

**Solución**: 
1. Ve a "Environment" en Render
2. Verifica que **Root Directory** sea `backend` (no vacío)
3. Redeploy desde el botón "Manual Deploy"

---

### ❌ 500 Internal Server Error

**Problema**: Falta alguna variable de entorno o la DB no está conectada.

**Solución**:
1. Ve a "Logs" en Render
2. Busca el error exacto
3. Revisa que `DATABASE_URL` sea la **Internal URL**
4. Verifica que todas las variables de entorno estén configuradas

---

### ❌ AI Finder no funciona

**Problema**: Falta `ANTHROPIC_API_KEY`.

**Solución**:
1. Ve a https://console.anthropic.com
2. Genera una API key
3. Agrégala en "Environment" en Render
4. Redeploy

---

### ❌ Frontend no carga (404)

**Problema**: El frontend no se compiló o no se copió a `backend/public/`.

**Solución**:
1. Ve a "Shell" en Render (terminal)
2. Ejecuta: `npm run build:frontend`
3. Verifica: `ls -la public/` (debería haber archivos del frontend)

---

## 💰 Costos

| Item | Free | Paid |
|------|------|------|
| **Web Service** | ✅ (750 hrs/mes, duerme después de 15 min) | $7/mes (siempre activo) |
| **PostgreSQL** | ⚠️ Solo 90 días trial | $7/mes |
| **Total** | $0 por 90 días → $7/mes | $14/mes |

**Recomendación**: Usa el plan **Starter** ($14/mes total) para producción. La versión Free es solo para testing.

---

## 🔄 Actualizar la App

Cuando hagas cambios en el código:

```bash
git add .
git commit -m "Update feature X"
git push origin main
```

Render detecta el push y hace **auto-deploy** automáticamente. 🚀

---

## ✅ Checklist Final

- [ ] Database PostgreSQL creada y "Available"
- [ ] Web Service creado con Root Directory = `backend`
- [ ] DATABASE_URL configurada (Internal URL)
- [ ] APOLLO_API_KEY configurada
- [ ] ANTHROPIC_API_KEY configurada
- [ ] BRAVE_API_KEY configurada
- [ ] JWT_SECRET configurada
- [ ] Deploy completado ("Live" en verde)
- [ ] URL funciona (landing page visible)
- [ ] Login funciona con test@test.com
- [ ] AI Finder funciona

---

## 🎉 ¡Listo!

Tu app MENTRAI está en producción:

🌐 **URL**: `https://tu-app.onrender.com`

Funcionalidades:
- ✅ Login/Register
- ✅ Dashboard
- ✅ AI Finder con Claude
- ✅ Listas de prospectos
- ✅ Búsqueda en Apollo.io
- ✅ Todo en una sola app

---

**¿Necesitas ayuda?** Lee [DEPLOYMENT.md](./DEPLOYMENT.md) para más detalles.

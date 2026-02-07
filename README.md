# 🚀 GUIA DE EJECUCION - MENTRAI PROSPECTING APP

## ⚡ Quick Start (5 minutos)

### 1. CONFIGURACION INICIAL

```bash
# Clonar o navegar al proyecto
cd mentrai-prospecting

# Verificar estructura
ls -la
# Deberias ver: backend/ frontend/ README.md
```

---

### 2. SETUP BACKEND

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env
# O crear manualmente:
nano .env
```

Contenido minimo de .env:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mentrai_db"

# JWT
JWT_SECRET=tu-super-secret-jwt-key-cambiala-123456
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Apollo.io (Opcional para empezar)
APOLLO_API_KEY=your-apollo-api-key-here
APOLLO_BASE_URL=https://api.apollo.io/api/v1
```

---

### 3. CONFIGURAR POSTGRESQL

Opcion A: PostgreSQL Local
```bash
# Instalar PostgreSQL (si no lo tienes)
# macOS:
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian:
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Crear base de datos
psql postgres
CREATE DATABASE mentrai_db;
CREATE USER mentrai_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE mentrai_db TO mentrai_user;
\q

# Actualizar DATABASE_URL en .env con tus credenciales
DATABASE_URL="postgresql://mentrai_user:tu_password@localhost:5432/mentrai_db"
```

Opcion B: PostgreSQL en Docker (Mas facil)
```bash
# Crear y arrancar PostgreSQL en Docker
docker run --name mentrai-postgres \
	-e POSTGRES_DB=mentrai_db \
	-e POSTGRES_USER=mentrai_user \
	-e POSTGRES_PASSWORD=mentrai_pass \
	-p 5432:5432 \
	-d postgres:14

# DATABASE_URL en .env:
DATABASE_URL="postgresql://mentrai_user:mentrai_pass@localhost:5432/mentrai_db"
```

Opcion C: Neon.tech (PostgreSQL Cloud - GRATIS)
```bash
# 1. Ir a https://neon.tech
# 2. Sign up gratis
# 3. Crear proyecto "MENTRAI"
# 4. Copiar connection string
# 5. Pegar en .env

# Ejemplo:
DATABASE_URL="postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/mentrai?sslmode=require"
```

---

### 4. MIGRAR Y SEEDEAR BASE DE DATOS

```bash
# Desde backend/

# Generar Prisma Client
npx prisma generate

# Crear tablas en la base de datos
npx prisma migrate dev --name init

# Poblar con datos de prueba
npm run seed
# o
node prisma/seed.js

# Deberias ver:
# ✅ Created users: admin@mentrai.com, sales@mentrai.com
# ✅ Created 8 companies
# ✅ Created 13 contacts
# ✅ Created 3 lists
# ✅ Created 2 campaigns
```

Si da error de seed:
```bash
# Agregar script a package.json:
{
	"scripts": {
		"seed": "node prisma/seed.js"
	}
}

# Luego:
npm run seed
```

---

### 5. ARRANCAR BACKEND

```bash
# Desde backend/

# Modo desarrollo (con hot reload)
npm run dev

# Deberias ver:
# 🚀 Server running on port 5000
# ✅ Database connected

# Verificar que funciona:
curl http://localhost:5000/health
# Response: {"status":"ok"}
```

---

### 6. SETUP FRONTEND

Nueva terminal (manten backend corriendo)

```bash
cd frontend

# Instalar dependencias
npm install

# Crear .env
nano .env
```

Contenido de frontend/.env:
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 7. ARRANCAR FRONTEND

```bash
# Desde frontend/

# Modo desarrollo
npm run dev

# Deberias ver:
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

---

### 8. PROBAR LA APLICACION

1. Abrir browser: http://localhost:5173

2. Login con credenciales de prueba:
	 - Email: `admin@mentrai.com`
	 - Password: `password123`

3. Explorar funcionalidades:
	 - ✅ Dashboard con metricas
	 - ✅ AI Finder (busqueda de empresas)
	 - ✅ Lists (ver listas creadas)
	 - ✅ Company Details (ver Factorial HR)
	 - ✅ Settings

---

## 🧪 TESTING DE ENDPOINTS

### Test Manual con curl/httpie

```bash
# Health check
curl http://localhost:5000/health

# Register nuevo usuario
curl -X POST http://localhost:5000/api/auth/register \
	-H "Content-Type: application/json" \
	-d '{
		"email": "test@mentrai.com",
		"password": "test123",
		"firstName": "Test",
		"lastName": "User"
	}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{
		"email": "admin@mentrai.com",
		"password": "password123"
	}'

# Guardar el token de la respuesta y usarlo:
TOKEN="tu-jwt-token-aqui"

# Get companies
curl http://localhost:5000/api/companies \
	-H "Authorization: Bearer $TOKEN"

# Get lists
curl http://localhost:5000/api/lists \
	-H "Authorization: Bearer $TOKEN"

# Get company details
curl http://localhost:5000/api/companies/[COMPANY_ID] \
	-H "Authorization: Bearer $TOKEN"
```

### Test con Postman/Thunder Client

Importar coleccion:

1. Abrir Postman/Thunder Client
2. Crear nueva coleccion "MENTRAI"
3. Agregar requests:

```
POST http://localhost:5000/api/auth/register
POST http://localhost:5000/api/auth/login
GET  http://localhost:5000/api/companies (Auth: Bearer Token)
GET  http://localhost:5000/api/lists (Auth: Bearer Token)
GET  http://localhost:5000/api/campaigns (Auth: Bearer Token)
```

---

## 🔍 EXPLORAR BASE DE DATOS

### Prisma Studio (GUI)

```bash
cd backend
npx prisma studio

# Se abre en http://localhost:5555
# Puedes ver y editar todos los datos
```

### psql (CLI)

```bash
# Conectar a la base de datos
psql postgresql://mentrai_user:mentrai_pass@localhost:5432/mentrai_db

# Comandos utiles:
\dt                    # Listar tablas
\d "Company"           # Ver estructura de tabla
SELECT * FROM "Company";
SELECT * FROM "Contact";
SELECT * FROM "List";
\q                     # Salir
```

---

## 📊 DATOS DE PRUEBA INCLUIDOS

### Usuarios
- `admin@mentrai.com` / `password123` (Admin)
- `sales@mentrai.com` / `password123` (User)

### Empresas (8)
1. **Factorial HR** (Score: 95) - SaaS, Series B, Barcelona
2. **Typeform** (Score: 92) - SaaS, Series C, Barcelona
3. **Holded** (Score: 88) - FinTech, Series A, Barcelona
4. **Glovo** (Score: 75) - Technology, Unicorn, Barcelona
5. **Wallapop** (Score: 78) - E-commerce, Series F, Barcelona
6. **Deloitte Digital** (Score: 72) - Professional Services, Madrid
7. **Startup BCN** (Score: 65) - SaaS, Seed, Barcelona
8. **TechStart** (Pending enrichment) - Valencia

### Contactos (13)
- CEOs, VPs, Directors de Sales/HR/Ops
- Emails verificados
- LinkedIn URLs
- Relevance scores calculados

### Listas (3)
1. "SaaS Targets - Barcelona" (3 empresas, 7 contactos)
2. "Series A/B Companies" (2 empresas, 4 contactos)
3. "C-Level Contacts" (5 empresas, 8 contactos)

### Campanas (2)
1. "Q1 2026 - SaaS Outreach" (Active)
2. "Series A/B - Executive Pitch" (Draft)

---

## ⚙️ CONFIGURAR APOLLO.IO (Opcional)

### Paso 1: Crear Cuenta
1. Ir a https://www.apollo.io/
2. Sign up (Free plan disponible)
3. Completar onboarding

### Paso 2: Obtener API Key
1. Settings → Integrations → API
2. Create New Key → Master Key
3. Copiar el key

### Paso 3: Configurar en Backend
```bash
# Editar backend/.env
APOLLO_API_KEY=tu-apollo-api-key-real

# Reiniciar backend
npm run dev
```

### Paso 4: Probar AI Finder
1. Login en la app
2. Ir a "AI Finder"
3. Filtrar por:
	 - Industry: SaaS
	 - Company Size: 51-200
	 - Location: Barcelona, Spain
4. Click "Search"
5. Deberias ver empresas reales de Apollo

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot connect to database"
```bash
# Verificar que PostgreSQL esta corriendo
# Docker:
docker ps | grep postgres

# Local:
pg_isready

# Verificar credenciales en .env
echo $DATABASE_URL
```

### Error: "Port 5000 already in use"
```bash
# Cambiar puerto en backend/.env
PORT=5001

# O matar proceso en el puerto
lsof -ti:5000 | xargs kill -9
```

### Error: "Module not found"
```bash
# Re-instalar dependencias
cd backend && rm -rf node_modules package-lock.json
npm install

cd ../frontend && rm -rf node_modules package-lock.json
npm install
```

### Error: "Prisma Client not generated"
```bash
cd backend
npx prisma generate
```

### Error de CORS en frontend
```bash
# Verificar que backend/.env tiene:
CORS_ORIGIN=http://localhost:5173

# Verificar que frontend/.env tiene:
VITE_API_URL=http://localhost:5000/api
```

### Seed falla
```bash
# Limpiar y re-migrar
cd backend
npx prisma migrate reset
npm run seed
```

---

## 📦 COMANDOS UTILES

### Backend
```bash
npm run dev          # Arrancar en modo desarrollo
npm start            # Arrancar en produccion
npm run seed         # Poblar base de datos
npx prisma studio    # Abrir GUI de base de datos
npx prisma migrate   # Crear migracion
npx prisma generate  # Generar Prisma Client
```

### Frontend
```bash
npm run dev          # Arrancar en modo desarrollo
npm run build        # Build para produccion
npm run preview      # Preview del build
```

---

## ✅ CHECKLIST DE VERIFICACION

- [ ] PostgreSQL corriendo
- [ ] Backend .env configurado
- [ ] Base de datos migrada (`npx prisma migrate dev`)
- [ ] Seed ejecutado (`npm run seed`)
- [ ] Backend corriendo en :5000
- [ ] Frontend .env configurado
- [ ] Frontend corriendo en :5173
- [ ] Login funciona con admin@mentrai.com
- [ ] Dashboard muestra metricas
- [ ] AI Finder carga (aunque sin Apollo)
- [ ] Lists muestra 3 listas
- [ ] Company details funciona

---

## 🎯 PROXIMOS PASOS

1. Configurar Apollo.io para busquedas reales
2. Crear tu primera campana real
3. Importar empresas de tu target
4. Personalizar scoring segun tus criterios
5. Deploy a produccion (Railway/Render + Vercel)

---

## 📞 SOPORTE

Si algo no funciona:
1. Revisar logs de backend (`npm run dev`)
2. Revisar console del browser (F12)
3. Verificar que todas las dependencias se instalaron
4. Verificar versiones de Node (v18+) y PostgreSQL (v14+)

---

Listo para prospecting. 🚀
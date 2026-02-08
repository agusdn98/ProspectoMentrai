# ⚡ PASOS EXACTOS PARA ARREGLAR RENDER

## 🎯 Lo que tienes que hacer AHORA:

### 1️⃣ Ve a tu servicio en Render
- Abre https://dashboard.render.com
- Click en tu servicio (el que falló - "mentrai-app" o como lo hayas llamado)

### 2️⃣ Click en "Settings" (menú izquierdo)

### 3️⃣ Scroll hasta "Build & Deploy"

### 4️⃣ Edita "Root Directory"
```
Root Directory: backend
```
**⚠️ IMPORTANTE: Escribe exactamente "backend" (sin espacios, sin /)**

### 5️⃣ Verifica estos valores:
```
Build Command:  npm run build
Start Command:  npm start
```

### 6️⃣ Scroll abajo y click "Save Changes"

### 7️⃣ Render automáticamente redeploya

---

## ✅ Logs correctos (después del fix):

```
==> Using Root Directory: backend
==> Running build command 'npm run build'...

> mentrai-backend@1.0.0 build
> npm run build:frontend && npm run prisma:generate

==> Installing frontend dependencies...
==> Building frontend...
==> Copying to backend/public/...
==> Generating Prisma Client...
==> Build successful 🎉
==> Starting server...
🚀 Server running on port 5000
```

---

## 📸 Captura de lo que debes ver en Settings:

```
Build & Deploy
├── Root Directory:    [backend         ] ← CAMBIA ESTO
├── Build Command:     npm run build
└── Start Command:     npm start

Environment (más abajo)
├── NODE_ENV          production
├── DATABASE_URL      postgresql://...
├── JWT_SECRET        (agrega un secret largo)
├── APOLLO_API_KEY    (tu API key)
├── ANTHROPIC_API_KEY (tu API key)
├── BRAVE_API_KEY     (tu API key)
└── ...resto de variables
```

---

## 🔥 Si el servicio ya está creado:

**NO crees uno nuevo.** Solo:
1. Settings → Root Directory → `backend`
2. Save Changes
3. Espera el redeploy automático (2-5 min)

---

**¡Es solo cambiar UN campo y guardar!** 🚀

# 🚀 Cómo arreglar el error de Render

## ❌ Error actual:
```
npm error path /opt/render/project/src/package.json
npm error enoent Could not read package.json
```

**Causa**: Render está buscando `package.json` en la raíz, pero está en `backend/package.json`

---

## ✅ Solución: Configurar Root Directory

### 1. Ve a tu servicio en Render
- Dashboard → Tu servicio (el que falló)
- Click en el nombre del servicio

### 2. Settings
- Scroll hasta **Build & Deploy**
- Busca **Root Directory**

### 3. Configura esto:
```
Root Directory: backend
```

### 4. Verifica los comandos:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 5. Guarda y redeploy
- Click **Save Changes**
- Render automáticamente redeploya

---

## 📸 Captura de pantalla (lo que debes ver):

```
Settings → Build & Deploy:

Root Directory:     [backend        ]  ← Agrega esto
Build Command:      npm run build
Start Command:      npm start
```

---

## ✅ Resultado esperado:

Después de guardar, Render ejecutará:
```bash
cd backend/          # ← Entra a la carpeta
npm run build        # Compila frontend + Prisma
npm start            # Arranca el servidor
```

Y el error desaparecerá. ✨

---

## 🐛 Si el error persiste:

1. Ve a "Manual Deploy" → "Clear build cache & deploy"
2. Espera a que termine
3. Revisa los logs en tiempo real

---

## 📋 Configuración completa de Render:

```
Name: mentrai-app
Runtime: Node
Root Directory: backend          ← IMPORTANTE
Build Command: npm run build
Start Command: npm start

Environment Variables:
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secret-super-largo
APOLLO_API_KEY=tu-apollo-key
ANTHROPIC_API_KEY=tu-anthropic-key
BRAVE_API_KEY=tu-brave-key
ANTHROPIC_MODEL=claude-sonnet-4-20250514
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

¡Eso debería arreglarlo! 🎉

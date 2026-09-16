# FobiBike v2

Sistema de administración para FOBI Bike — inventario, ventas e IA (Fobi).

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19 + Vite + Tailwind CSS + React Router |
| Backend | Node.js + Express 5 |
| Base de datos | MySQL 8.0 (`fobibike_db`) |
| IA (Fobi) | Groq (gratis) / OpenAI / modo local |

## Estructura

```
fobibike/
├── backend/          # API REST (Node.js)
├── frontend/         # App React
├── .github/          # Deploy a GitHub Pages (demo)
└── README.md
```

## Requisitos

- Node.js 18+
- MySQL Server 8.0 (MySQL Workbench)

## Instalación rápida

### 1. Backend

```powershell
cd backend
copy .env.example .env
# Editá DB_PASSWORD, JWT secrets y GROQ_API_KEY
npm install
npm run dev
```

API: `http://localhost:3001`

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

> La base de datos MySQL (`fobibike_db`) debe existir y estar configurada en `backend/.env`.

## Configuración Fobi (IA)

En `backend/.env`:

```env
CHAT_PROVIDER=groq
GROQ_API_KEY=gsk_tu_key
GROQ_MODEL=llama-3.3-70b-versatile
```

Key gratis: [console.groq.com/keys](https://console.groq.com/keys)

## Seguridad

- JWT en cookies **httpOnly** + refresh token
- `SameSite=strict` y `Secure` en producción
- Rate limit: 200 req/15 min global, **5 intentos login**/15 min, 30 msgs chat/15 min
- Helmet, CORS restringido, SQL parametrizado
- Validación de `.env` al iniciar (JWT ≥ 32 chars en producción)
- Errores internos ocultos fuera de desarrollo
- **Nunca commitear** `backend/.env` (está en `.gitignore`)

## API principal

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/health` | No | Estado |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | No | Logout |
| GET | `/api/auth/me` | Opcional | Sesión |
| GET/POST/PUT/DELETE | `/api/products` | Sí | CRUD productos |
| GET | `/api/suppliers` | Sí | Proveedores |
| GET/POST/DELETE | `/api/sales` | Sí | Ventas e ingresos |
| POST | `/api/chat` | Sí | Fobi (IA) |

## Credenciales

Usuario en tabla `usuarios` (ej: `eduardo`).

## Demo en GitHub Pages

Hay una **vista pública** del frontend (sin datos reales) en:

**https://mat0222.github.io/fobibike/**

- Se ve la estructura: login demo, menú, inventario, ingresos y Fobi
- Los datos del negocio **no se muestran** (mensaje amigable de privacidad)
- No hace falta usuario ni contraseña

### Activar Pages (una sola vez)

1. En GitHub: **Settings → Pages**
2. **Source:** GitHub Actions
3. Hacé push a `main` (o corré el workflow *Deploy GitHub Pages*)

El workflow está en `.github/workflows/deploy-pages.yml`.

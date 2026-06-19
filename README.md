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
├── scripts/          # Importación y prueba de BD
├── legacy/           # PHP v1 archivado (no usar)
├── fobibike_db.sql   # Dump inicial de la base
└── README.md
```

## Requisitos

- Node.js 18+
- MySQL Server 8.0 (MySQL Workbench)

## Instalación rápida

### 1. Base de datos

```powershell
.\scripts\import-database.ps1
.\scripts\test-connection.ps1
```

### 2. Backend

```powershell
cd backend
copy .env.example .env
# Editá DB_PASSWORD, JWT secrets y GROQ_API_KEY
npm install
npm run dev
```

API: `http://localhost:3001`

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

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

## Legacy

El código PHP/XAMPP original está en `legacy/` solo como referencia histórica.

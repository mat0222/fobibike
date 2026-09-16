require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const productsRoutes = require('./routes/products.routes');
const suppliersRoutes = require('./routes/suppliers.routes');
const salesRoutes = require('./routes/sales.routes');
const invoicesRoutes = require('./routes/invoices.routes');
const repairsRoutes = require('./routes/repairs.routes');
const chatRoutes = require('./routes/chat.routes');
const { getProvider } = require('./services/chat.service');
const { ensureVentasTable, ensureFacturasTables, ensureReparacionesTables } = require('./config/initDb');
const { validateEnv } = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

validateEnv();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: isProduction,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiadas solicitudes' },
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/repairs', repairsRoutes);
app.use('/api/chat', chatRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.use(errorHandler);

async function startServer() {
  try {
    await ensureVentasTable();
    await ensureFacturasTables();
    await ensureReparacionesTables();
    app.listen(PORT, () => {
      const provider = getProvider();
      console.log(`FobiBike API corriendo en http://localhost:${PORT}`);
      if (provider === 'groq') {
        const ok = !!process.env.GROQ_API_KEY?.trim();
        console.log(`Fobi (IA): Groq ${ok ? 'listo' : '— falta GROQ_API_KEY (gratis en console.groq.com/keys)'}`);
      } else if (provider === 'openai') {
        const ok = !!process.env.OPENAI_API_KEY?.trim();
        console.log(`Fobi (IA): OpenAI ${ok ? 'listo' : '— falta OPENAI_API_KEY'}`);
      } else if (provider === 'local') {
        console.log('Fobi: modo local (sin IA) — cambia CHAT_PROVIDER=groq para IA gratis');
      } else {
        console.log(`Fobi (chat): provider desconocido "${provider}" — usa local, groq u openai`);
      }
    });
  } catch (error) {
    console.error('Error al iniciar:', error.message);
    process.exit(1);
  }
}

startServer();

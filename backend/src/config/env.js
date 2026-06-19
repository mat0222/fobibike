function validateEnv() {
  const required = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_NAME',
  ];

  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error(`Faltan variables en backend/.env: ${missing.join(', ')}`);
    process.exit(1);
  }

  const accessLen = process.env.JWT_ACCESS_SECRET.trim().length;
  const refreshLen = process.env.JWT_REFRESH_SECRET.trim().length;

  if (accessLen < 32 || refreshLen < 32) {
    const msg = 'JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben tener al menos 32 caracteres';
    if (process.env.NODE_ENV === 'production') {
      console.error(`[Seguridad] ${msg}`);
      process.exit(1);
    }
    console.warn(`[Seguridad] ${msg} (permitido en desarrollo)`);
  }

  if (accessLen > 0 && process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.error('[Seguridad] JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser distintos');
    process.exit(1);
  }

  const provider = (process.env.CHAT_PROVIDER || 'groq').trim().toLowerCase();
  if (provider === 'groq' && !process.env.GROQ_API_KEY?.trim()) {
    console.warn('[Fobi] CHAT_PROVIDER=groq pero falta GROQ_API_KEY');
  }
  if (provider === 'openai' && !process.env.OPENAI_API_KEY?.trim()) {
    console.warn('[Fobi] CHAT_PROVIDER=openai pero falta OPENAI_API_KEY');
  }
}

module.exports = { validateEnv };

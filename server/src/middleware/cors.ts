import cors from 'cors';

export function createCorsMiddleware() {
  const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3000';
  const origins = clientUrl.split(',').map((u) => u.trim());

  return cors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  });
}

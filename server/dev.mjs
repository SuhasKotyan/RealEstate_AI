import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { analyzeHandler, chatHandler, healthHandler } from './handlers.mjs';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
app.all('/api/analyze', analyzeHandler);
app.all('/api/chat', chatHandler);
app.all('/api/health', healthHandler);
app.use('/api', (req, res) =>
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown API route.' } }),
);
if (process.argv.includes('--production'))
  app.use(express.static(fileURLToPath(new URL('../dist', import.meta.url))));
app.use((error, req, res, next) => {
  res
    .status(error.type === 'entity.too.large' ? 413 : 400)
    .json({
      error: { code: 'INVALID_BODY', message: 'The request body is invalid or too large.' },
    });
});
app.listen(Number(process.env.PORT) || 3001, '127.0.0.1', () =>
  console.log(`Closewise API: http://127.0.0.1:${Number(process.env.PORT) || 3001}`),
);

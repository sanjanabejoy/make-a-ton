import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { config } from './config.js';
import { timing } from './middleware/timing.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getToday } from './lib/clock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Security and standard middlewares
app.use(helmet());
app.use(cors({
  origin: config.appUrl,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(timing);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const today = await getToday();
  res.json({
    status: 'ok',
    today,
    nodeEnv: config.nodeEnv,
    demoMode: config.demoMode
  });
});

// Auto-mount modules/*/routes.js (Contract §3.1)
export async function mountModules(expressApp = app) {
  const modulesDir = path.resolve(__dirname, 'modules');
  if (!fs.existsSync(modulesDir)) {
    fs.mkdirSync(modulesDir, { recursive: true });
    return;
  }

  const entries = fs.readdirSync(modulesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const routesFile = path.join(modulesDir, entry.name, 'routes.js');
    if (!fs.existsSync(routesFile)) continue;

    try {
      const fileUrl = pathToFileURL(routesFile).href;
      const mod = await import(fileUrl);

      if (Array.isArray(mod.mounts)) {
        for (const m of mod.mounts) {
          if (m.path && m.router) {
            expressApp.use(m.path, m.router);
            console.log(`[auto-mount] ${entry.name} mounted at ${m.path}`);
          }
        }
      } else if (mod.path && mod.router) {
        expressApp.use(mod.path, mod.router);
        console.log(`[auto-mount] ${entry.name} mounted at ${mod.path}`);
      } else {
        console.warn(`[auto-mount] ${entry.name}/routes.js did not export path/router or mounts`);
      }
    } catch (err) {
      console.error(`[auto-mount] Failed to load module ${entry.name}:`, err);
    }
  }
}

// Initial auto-mount on module load
await mountModules(app);

// 404 Handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`
    }
  });
});

// Central Error Handler
app.use(errorHandler);


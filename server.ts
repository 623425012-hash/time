import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { authRouter } from './server/routes/authRoutes';
import { eventRouter } from './server/routes/eventRoutes';
import { holidayRouter } from './server/routes/holidayRoutes';
import { dutyRouter } from './server/routes/dutyRoutes';
import { birthdayRouter } from './server/routes/birthdayRoutes';
import { announcementRouter } from './server/routes/announcementRoutes';
import { userRouter } from './server/routes/userRoutes';
import { reportRouter } from './server/routes/reportRoutes';
import { dashboardRouter } from './server/routes/dashboardRoutes';
import { searchRouter } from './server/routes/searchRoutes';
import { settingRouter } from './server/routes/settingRoutes';
import { logRouter } from './server/routes/logRoutes';
import { fileRouter } from './server/routes/fileRoutes';
import { scheduler } from './server/scheduler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vercel Cron Trigger Endpoint
  app.get('/api/scheduler/cron', async (_req, res) => {
    try {
      await scheduler.checkJobs();
      res.json({ success: true, message: 'Cron job executed successfully', timestamp: new Date().toISOString() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Mount API Endpoints
  app.use('/api/auth', authRouter);
  app.use('/api/events', eventRouter);
  app.use('/api/holidays', holidayRouter);
  app.use('/api/duties', dutyRouter);
  app.use('/api/birthdays', birthdayRouter);
  app.use('/api/announcements', announcementRouter);
  app.use('/api/users', userRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/settings', settingRouter);
  app.use('/api/logs', logRouter);
  app.use('/api/files', fileRouter);

  // Start background job scheduler
  scheduler.start();

  // Vite middleware for development / Static assets for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[School Calendar App] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
});

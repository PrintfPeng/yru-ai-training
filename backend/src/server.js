import { env } from './config/env.js';
import { assertDbReady, pool } from './config/db.js';
import { createApp, FRONTEND_READY, DIST_DIR } from './app.js';

const app = createApp();

async function main() {
  await assertDbReady();
  // eslint-disable-next-line no-console
  console.log(`✔ DB connected → ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);

  const server = app.listen(env.PORT, env.HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 API listening on http://${env.HOST}:${env.PORT}  (env=${env.NODE_ENV})`);
    // eslint-disable-next-line no-console
    console.log(`   Health:  ${env.PUBLIC_BASE_URL}/api/health`);
    if (FRONTEND_READY) {
      // eslint-disable-next-line no-console
      console.log(`   Frontend served from  ${DIST_DIR}`);
    } else {
      // eslint-disable-next-line no-console
      console.log('   (no dist/ found — API only)');
    }
  });

  // Graceful shutdown so pool + socket close cleanly
  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received — shutting down...`);
    server.close(async () => {
      try { await pool.end(); } catch (_) { /* ignore */ }
      // eslint-disable-next-line no-console
      console.log('✔ Bye');
      process.exit(0);
    });
    // Force-exit after 10s
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Fatal boot error:', err);
  process.exit(1);
});

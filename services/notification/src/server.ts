import 'dotenv/config';
import { startConsumer } from './consumer';

(async () => {
  try {
    await startConsumer();
    console.log('[notification-service] ready');
  } catch (err) {
    console.error('[notification-service] failed to start:', err);
    process.exit(1);
  }
})();

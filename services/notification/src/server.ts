import 'dotenv/config';
import { startConsumer } from './consumer';
import { logger } from './logger';

(async () => {
  try {
    await startConsumer();
    logger.info('notification service ready');
  } catch (err) {
    logger.error({ err }, 'notification service failed to start');
    process.exit(1);
  }
})();

import 'dotenv/config';
import app from './app';
import { logger } from './logger';

const PORT = process.env.PORT ?? 3003;

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'tab service started');
});

import 'dotenv/config';
import app from './app';
import { logger } from './logger';

const PORT = process.env.PORT ?? 3002;

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'friendship service started');
});

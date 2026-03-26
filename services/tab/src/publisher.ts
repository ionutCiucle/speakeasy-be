import amqplib from 'amqplib';

const EXCHANGE = 'speakeasy.events';
let channel: amqplib.Channel | null = null;

async function getChannel(): Promise<amqplib.Channel> {
  if (channel) return channel;

  const conn = await amqplib.connect(process.env.RABBITMQ_URL ?? 'amqp://localhost');
  channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  return channel;
}

export async function publish(routingKey: string, payload: object): Promise<void> {
  try {
    const ch = await getChannel();
    ch.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
  } catch (err) {
    console.error(`[tab-service] failed to publish ${routingKey}:`, err);
  }
}

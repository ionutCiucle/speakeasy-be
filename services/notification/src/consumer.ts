import amqplib from 'amqplib';
import { onFriendshipRequested, onFriendshipAccepted, onTabInviteSent, onTabSettled } from './handlers';

const EXCHANGE = 'speakeasy.events';

const ROUTING_KEYS = ['friendship.requested', 'friendship.accepted', 'tab.invite_sent', 'tab.settled'] as const;
type RoutingKey = typeof ROUTING_KEYS[number];

function dispatch(routingKey: RoutingKey, payload: unknown): void {
  switch (routingKey) {
    case 'friendship.requested': return onFriendshipRequested(payload as Parameters<typeof onFriendshipRequested>[0]);
    case 'friendship.accepted': return onFriendshipAccepted(payload as Parameters<typeof onFriendshipAccepted>[0]);
    case 'tab.invite_sent': return onTabInviteSent(payload as Parameters<typeof onTabInviteSent>[0]);
    case 'tab.settled': return onTabSettled(payload as Parameters<typeof onTabSettled>[0]);
  }
}

export async function startConsumer(): Promise<void> {
  const url = process.env.RABBITMQ_URL ?? 'amqp://localhost';
  const conn = await amqplib.connect(url);
  const channel = await conn.createChannel();

  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  for (const routingKey of ROUTING_KEYS) {
    const { queue } = await channel.assertQueue(`notification.${routingKey}`, { durable: true });
    await channel.bindQueue(queue, EXCHANGE, routingKey);

    channel.consume(queue, (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        dispatch(routingKey, payload);
        channel.ack(msg);
      } catch (err) {
        console.error(`[notification-service] failed to handle ${routingKey}:`, err);
        channel.nack(msg, false, false);
      }
    });

    console.log(`[notification-service] subscribed to ${routingKey}`);
  }
}

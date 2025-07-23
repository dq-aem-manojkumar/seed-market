// services/websocket.ts
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Constants from "expo-constants";
import { logger } from "@/utils/logger";

let stompClient: Client | null = null;
let connectionPromise: Promise<void> | null = null;
let isConnecting = false;

const WS_URL = `http://192.168.1.27:8081/ws`;

/**
 * Connect to WebSocket server using SockJS and STOMP
 */
export const connectWebSocket = (onReady: () => void) => {
  // If already connected, call onReady immediately
  if (stompClient && stompClient.connected) {
    logger.debug("WebSocket already connected");
    onReady();
    return;
  }
  
  // If connection is in progress, wait for it
  if (isConnecting && connectionPromise) {
    connectionPromise.then(onReady).catch((error) => {
      logger.error("WebSocket connection failed", error);
    });
    return;
  }
  
  isConnecting = true;
  
  // Disconnect existing connection if any
  if (stompClient && stompClient.connected) {
    stompClient.deactivate();
  }
  
  connectionPromise = new Promise((resolve, reject) => {
    try {
      const socket = new SockJS(WS_URL);
      stompClient = new Client({
        webSocketFactory: () => socket,
        debug: (str) => logger.debug("WebSocket Debug", str),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          logger.wsConnect(WS_URL);
          isConnecting = false;
          resolve();
          onReady(); // trigger subscriptions
        },
        onDisconnect: () => {
          logger.wsDisconnect(WS_URL);
          isConnecting = false;
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            if (stompClient && !stompClient.connected) {
              logger.info("Attempting to reconnect WebSocket...");
              isConnecting = true;
              stompClient.activate();
            }
          }, 3000);
        },
        onStompError: (frame) => {
          logger.wsError(frame);
          isConnecting = false;
          reject(new Error(`STOMP Error: ${frame.headers.message}`));
        },
        onWebSocketError: (error) => {
          logger.wsError(error);
          isConnecting = false;
          reject(error);
        },
      });

      stompClient.activate();
    } catch (error) {
      isConnecting = false;
      reject(error);
    }
  });
};

/**
 * Subscribe to incoming messages for a user (chat messages)
 */
export const subscribeToMessages = (
  userId: string,
  onMessage: (msg: IMessage) => void
) => {
  if (!stompClient?.connected) {
    logger.warn("Cannot subscribe to messages: WebSocket not connected");
    return;
  }
  const topic = `/topic/messages/${userId}`;
  logger.info("Subscribing to messages topic", { topic, userId });
  stompClient.subscribe(topic, onMessage);
};

/**
 * Subscribe to chat messages (duplicate safe)
 */
export const subscribeChatToMessages = (
  userId: string,
  onMessage: (msg: IMessage) => void
) => {
  if (!stompClient?.connected) {
    logger.warn("Cannot subscribe to chat messages: WebSocket not connected");
    return;
  }
  const topic = `/topic/messages/${userId}`;
  logger.info("Subscribing to messages topic", { topic, userId });
  stompClient.subscribe(topic, (msg: IMessage) => {
    onMessage(msg);
  });
};

/**
 * Subscribe to seller topic
 */
export const subscribeToSeller = (
  sellerId: string,
  onMessage: (msg: IMessage) => void
) => {
  if (!stompClient?.connected) {
    logger.warn("Cannot subscribe to seller topic: WebSocket not connected");
    return;
  }
  const topic = `/topic/requests/${sellerId}`;
  logger.info("Subscribing to seller topic", { topic, sellerId });
  stompClient.subscribe(topic, onMessage);
};

/**
 * Subscribe to buyer topic
 */
export const subscribeToBuyer = (
  buyerId: string,
  onMessage: (msg: IMessage) => void
) => {
  if (!stompClient?.connected) {
    logger.warn("Cannot subscribe to buyer topic: WebSocket not connected");
    return;
  }
  const topic = `/topic/request-status/${buyerId}`;
  logger.info("Subscribing to buyer topic", { topic, buyerId });
  stompClient.subscribe(topic, onMessage);
};

/**
 * Disconnect WebSocket client
 */
export const disconnectWebSocket = () => {
  if (stompClient && stompClient.connected) {
    logger.wsDisconnect(WS_URL);
    stompClient.deactivate();
  }
  stompClient = null;
  connectionPromise = null;
  isConnecting = false;
};

/**
 * Send chat message to destination via STOMP
 */
export const sendChatMessage = (chatMessage: {
  senderId: string;
  receiverId: string;
  content: string;
  product: { id: number };
}) => {
  if (!stompClient?.connected) {
    logger.error("Cannot send message: WebSocket not connected");
    throw new Error("WebSocket not connected");
  }

  const destination = "/app/chat.send";

  stompClient.publish({
    destination,
    body: JSON.stringify(chatMessage),
  });

  logger.info("Chat message sent", { destination, chatMessage });
};

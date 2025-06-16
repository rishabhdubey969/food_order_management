export const KAFKA_CONSTANTS = {
  MESSAGES: {
    SUCCESS: {
      CONNECTED: 'Successfully connected to Kafka',
      DISCONNECTED: 'Successfully disconnected from Kafka',
      EVENT_EMITTED: 'Successfully emitted event to topic',
      MESSAGE_ACKED: 'Received acknowledgment from topic',
    },
    ERROR: {
      CONNECTION_FAILED: 'Failed to establish Kafka connection during application startup',
      DISCONNECTION_FAILED: 'Error during Kafka disconnection',
    },
  },
  TOPICS: {
    DELIVERY_PARTNER_RESPONSE: 'deliveryPartnerResponse',
  },
  CLIENT: {
    INJECTION_TOKEN: 'KAFKA_SERVICE',
  },
};
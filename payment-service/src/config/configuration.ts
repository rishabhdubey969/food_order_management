export default () => {
  return {
    db: {
      uri: process.env.MONGO_URI,
    },
    port: {
      port_number: process.env.PORT,
    },
    stripe: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_SECRET_WEBHOOK: process.env.STRIPE_SECRET_WEBHOOK,
    },
  };
};

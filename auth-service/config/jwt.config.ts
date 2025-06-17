export default () => ({
  redisHost: process.env.REDIS_HOST,
  redisPort: Number(process.env.REDIS_PORT),
});

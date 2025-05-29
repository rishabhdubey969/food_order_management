
export default () => {
    return Object.freeze({

        app: {
            port: process.env.DELIVERY_APP_PORT
        },

        db: {
            uri: process.env.MONGO_URI
        },

        redis: {
            port: process.env.REDIS_PORT,
            host: process.env.REDIS_HOST
        }
    })
}
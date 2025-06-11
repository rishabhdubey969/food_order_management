
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
        },

        jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN
        },

        email: {
            service: process.env.SERVICE,
            userEmail: process.env.USER_EMAIL,
            userPass: process.env.USER_PASSWORD
        }
    })
}
import { JWT_SECRET } from "../common/constants"

export default () => {
    return {
      db: {
        uri: process.env.MONGO_URI,
      }
      ,
      port:{
        port_number: process.env.PORT
      },
      jwt:{
        JWT_SECRET:process.env.JWT_SECRET,
        JWT_EXPIRES_IN:process.env.JWT_EXPIRES_IN
      }
    }}
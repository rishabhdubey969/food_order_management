export default () => {
    return {
      db: {
        uri: process.env.MONGO_URI,
      }
      ,
      port:{
        port_number: process.env.PORT
      }
    }}
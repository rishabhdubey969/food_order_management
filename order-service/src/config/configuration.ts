export default ()=>{
    return {
      db:{
        uri:process.env.MONGO_URI,
      },
      port:{
        order:process.env.ORDER_PORT
      }
    }
}
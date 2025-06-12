export default ()=>{
    return {
      db:{
        uri:process.env.MONGO_URI,
      },
      port:{
        order:process.env.ORDER_PORT
      },
      jwt:{
         secret:process.env.JWT_SECRET,
         expiry:process.env.JWT_EXPIRY
      }
    }
}
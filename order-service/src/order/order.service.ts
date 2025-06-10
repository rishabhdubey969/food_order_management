import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException, RequestTimeoutException } from '@nestjs/common';
import { InjectConnection, InjectModel, ParseObjectIdPipe } from '@nestjs/mongoose';
import mongoose, { Connection, Model, Mongoose, Types} from 'mongoose';
import { ObjectId } from 'mongodb';
import { Address, Order, OrderStatus, PaymentMethod, PaymentStatus, ProductItem } from 'src/schema/order.schema';
@Injectable()
export class OrderService {
    private readonly roleCollections = {
        USER: 'address',
        CART: 'carts',
        RESTAURANT:'restaurants',
    };
    constructor(@InjectModel(Order.name) private OrderSchema:Model<Order>,
    @InjectConnection() private readonly connection: Connection){}
    
    getHello(): string {
        return "hello world";
    }
     
    createItems(products){
        const items=[{}];
        for(let i=0;i<products.length;i++){
            const item=new ProductItem();
                item.productId=products[i].itemId;
                item.quantity=products[i].quantity;
                item.name=products[i].name;
                item.price=products[i].price;
            items.push(item);
        }
        return items;
    }
    createAddress(ADDRESS){
        const address=new Address();
        address.address=ADDRESS.address||ADDRESS.address_location_1;
        address.contactNumber=ADDRESS.phone||'9676534567';
        address.email=ADDRESS.email||'abc1@gmail.com';
        address.latitude=ADDRESS.latitude;
        address.longitude=ADDRESS.longitude;

        return address;
    }
    
    async createOrder(cartId) {
        try {
          const cartData = await this.connection.collection(this.roleCollections.CART).findOne({ _id: new ObjectId(cartId) });
          if (!cartData) {
            throw new NotFoundException('Cart not found');
          }
          if (!cartData.items || cartData.items.length === 0) {
            throw new BadRequestException('Cart is empty');
          }
      
          
          const items = this.createItems(cartData.items);
          
        
          const restaurantData=await this.connection.collection(this.roleCollections.RESTAURANT).findOne({_id:new ObjectId(cartData.restaurantId)});
          // console.log(restaurantData);
          if (!restaurantData) {
            throw new NotFoundException('Restaurant not found');
          }
          const restaurantAddress = this.createAddress(restaurantData);
      
       
          const userAddressData = await this.connection.collection(this.roleCollections.USER)
            .findOne({ user_id: cartData.userId });
          if (!userAddressData) {
            throw new NotFoundException('User address not found');
          }
          const userAddress = this.createAddress(userAddressData);
      
       
          if (isNaN(cartData.subtotal) || isNaN(cartData.total) || 
              isNaN(cartData.tax) || isNaN(cartData.deliveryCharges) || 
              isNaN(cartData.platformFee) || isNaN(cartData.discount)) {
            throw new BadRequestException('Invalid financial values in cart');
          }
      
          
          const epochSeconds = Math.floor(Date.now() / 1000);

          const orderCreated = await this.OrderSchema.create({
            userId: cartData.userId,
            restaurantId: cartData.restaurantId,
            cartId: cartData._id,
            paymentId: "NILL",
            paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
            paymentStatus: PaymentStatus.PENDING,
            deliveryAddress: userAddress,
            restaurantAddress: restaurantAddress,
            items: items,
            subtotal: cartData.subtotal,
            tax: cartData.tax,
            deliveryFee: cartData.deliveryCharges,
            platformFee: cartData.platformFee,
            discount: cartData.discount,
            total: cartData.total,
            status: OrderStatus.CONFIRMED,
            timestamp:epochSeconds,
          });
      
      
          return orderCreated._id;
      
        } catch (error) {
          if (error instanceof HttpException) {
            throw error;
          }
          
          throw new InternalServerErrorException('Failed to create order');
        }
    }
    async updateOrder(orderId,paymentId,paymentStatus,paymentMethod,OrderStatus){
        try {
            const updatedOrder = await this.OrderSchema.findByIdAndUpdate(
                orderId,
                {
                  $set: {
                    paymentId:paymentId||"NILL",
                    paymentMethod:paymentMethod,
                    paymentStatus: paymentStatus,
                    status: OrderStatus
                  }
                },
                { new: true, runValidators: true }
              );
            if (!updatedOrder) {
              throw new NotFoundException('Order not found');
            }
            return updatedOrder;
          } catch (error) {
            throw error;
          }
    }

    async cancelOrder(orderId:string){
      try{
            const cancelledOrder=await this.OrderSchema.findById(orderId);
            if (!cancelledOrder) {
              throw new NotFoundException('Order not found');
            }
            const currentTime = Math.floor(Date.now() / 1000);
            const orderCreatedTime=new Number(cancelledOrder.timestamp);
            const difference=currentTime-orderCreatedTime.valueOf();
            if((difference)>60){
                throw new RequestTimeoutException("cannot cancel order");
            }
            cancelledOrder.status=OrderStatus.CANCELLED;
            cancelledOrder.save();
            return cancelledOrder;
          } 
          catch (error){
            throw error;
          }

    }

    async getOrder(orderId:string){
      try{
          const order=await this.OrderSchema.findById(orderId);
          if (!order) {
            throw new NotFoundException('Order not found');
          }
          return order;
      }
      catch(error){
         throw error;
      }
    }
   
    async getAllOrder(userId:string,query){
      try{
        const skip = ((query.page) - 1) * (query.limit);
         const allOrder=await this.OrderSchema.find({userId:userId})
         .skip(skip)
        .limit(query.limit)
        .sort({ createdAt: 1 });
         if(!allOrder){
             throw new NotFoundException('order does not exits');
         }
         return allOrder;
      }
      catch(error){
        throw error;
      }
      
    }

    async getInvoice(orderId){
        
    }
}

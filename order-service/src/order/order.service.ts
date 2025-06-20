import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException, RequestTimeoutException } from '@nestjs/common';
import { InjectConnection, InjectModel, ParseObjectIdPipe } from '@nestjs/mongoose';
import mongoose, { Connection, Model, Mongoose, MongooseError, Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Address, Order, ProductItem } from 'src/schema/order.schema';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { PlaceOrderDto } from 'src/dto/placeOrder.dto';
import { PaymentClient } from 'src/grpc/payment/payment.client';
import { KafkaService } from 'src/kafka/kafka.service';
import { ClientProxy, Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { ERROR } from './constant/message.constant';
import { OrderStatus, PaymentMethod, PaymentStatus } from './constant/enum.constant';





@Injectable()
export class OrderService {
  private readonly roleCollections = {
    ADDRESS: 'address',
    CART: 'carts',
    RESTAURANT: 'restaurants',
  };
  constructor(@InjectModel(Order.name) private OrderSchema: Model<Order>,
    @InjectConnection() private readonly connection: Connection,
    private paymentClient: PaymentClient,
    private readonly kafkaService: KafkaService,
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy
  ) { }

  getHello(): string {
    return "hello world";
  }

  createItems(products) {
    const items: Array<object> = [];
    for (let i = 0; i < products.length; i++) {
      const item = new ProductItem();
      item.productId = products[i].itemId;
      item.quantity = products[i].quantity;
      item.name = products[i].name;
      item.price = products[i].price;
      items.push(item);
    }
    return items;
  }
  createRestaurantAddress(ADDRESS: any) {
    const address = new Address();
    address.address = ADDRESS.address || ADDRESS.address_location_1;
    address.contactNumber = ADDRESS.phone || '9676534567';
    address.email = ADDRESS.email || 'abc1@gmail.com';
    address.latitude = ADDRESS.location.coordinates[0];
    address.longitude = ADDRESS.location.coordinates[1];

    return address;
  }
  createUserAddress(ADDRESS: any) {
    const address = new Address();
    address.address = ADDRESS.address_location_1;
    address.contactNumber = ADDRESS.phone ||"8090064743";
    address.email = ADDRESS.email||"abc@gmail.com";
    address.latitude = ADDRESS.latitude;
    address.longitude = ADDRESS.longitude;
    return address;
  }
  async createOrder(cartId,addressId) {
    const startTime = Date.now();

    try {
      // checking cart already exist in order db or not
        // const alreadyExists= await this.OrderSchema.findOne({cartId:cartId});
        // if(alreadyExists){
        //    throw new BadRequestException(alreadyExists);
        // }
        // calling manager service
      const data=await this.handleKitchen({cartId:cartId});
        if(typeof data === 'string'){
          throw new InternalServerErrorException(data);
        }
    
      const cartData = await this.connection.collection(this.roleCollections.CART).findOne({ _id: new ObjectId(cartId) });
      if (!cartData) {
        throw new NotFoundException(ERROR.NOT_EXIST);
      }
      if (!cartData.items || cartData.items.length === 0) {
        throw new BadRequestException(ERROR.NO_ITEMS);
      }
      const items = this.createItems(cartData.items);

      const restaurantData = await this.connection.collection(this.roleCollections.RESTAURANT).findOne({ _id: new ObjectId(cartData.restaurantId) });

      if (!restaurantData) {
        throw new NotFoundException(ERROR.NO_REST);
      }
      const restaurantAddress = this.createRestaurantAddress(restaurantData);
      const userAddressData = await this.connection.collection(this.roleCollections.ADDRESS)
        .findOne({_id:new ObjectId(addressId)});
      
      if (!userAddressData) {
        throw new NotFoundException(ERROR.NO_USER_ADD);
      }
      const userAddress = this.createUserAddress(userAddressData);
      if (isNaN(cartData.subtotal) || isNaN(cartData.total) ||
        isNaN(cartData.tax) || isNaN(cartData.deliveryCharges) ||
        isNaN(cartData.platformFee) || isNaN(cartData.discount)) {
        throw new BadRequestException(ERROR.INVALID_DETAILS);
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
        timestamp: epochSeconds,
      });

      return { "orderId": orderCreated._id };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ERROR.FAILED_ORDER);
    }
  }
  async updateOrder(orderId, paymentId, paymentStatus, paymentMethod, OrderStatus) {
    try {
      const updatedOrder = await this.OrderSchema.findByIdAndUpdate(
        orderId,
        {
          $set: {
            paymentId: paymentId,
            paymentMethod: paymentMethod,
            paymentStatus: paymentStatus,
            status: OrderStatus
          }
        },
        { new: true, runValidators: true }
      );
      if (!updatedOrder) {
        throw new NotFoundException(ERROR.NOT_EXIST);
      }
      return { "orderInfo": updatedOrder };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException(ERROR.FAILED_UPDATE);
    }
  }
  

  async placeOrder(data: PlaceOrderDto, request: any){
    if (data.modeOfPayment == "cashOnDelivery") {
      try {
        await this.handleCart({ userId: request.sub});
        await this.handleDelivery({ orderId: data.orderId });
        await this.client.emit('orderConfirmed', { email: request.email, modeofPayment: data.modeOfPayment, message: "order Confirmed" });
        return await this.updateOrder(data.orderId, "NILL", PaymentStatus.PENDING, PaymentMethod.CASH_ON_DELIVERY, OrderStatus.PREPARING);
      } catch (error) {
        await this.updateOrder(data.orderId,"NILL",PaymentStatus.FAILED,PaymentMethod.CASH_ON_DELIVERY,OrderStatus.FAILED);
        throw new Error(ERROR.FAILED_COD);
      }
    } 
    else if (data.modeOfPayment == "online") {
      try {
        const paymentData = await this.paymentClient.getPayStatus(data.orderId.toString());
        
        if (paymentData.paymentStatus == "Failed") {
          const orderCancelled = await this.updateOrder(data.orderId, paymentData.paymentID, PaymentStatus.FAILED, PaymentMethod.UPI, OrderStatus.CANCELLED );
          return orderCancelled;
        }
        else if (paymentData.paymentStatus == "completed") {
          await this.handleCart({ userId: request.sub});
          await this.handleDelivery({ orderId: data.orderId });
          await this.client.emit('orderConfirmed', { email: request.email, modeofPayment: data.modeOfPayment, message: "order Confirmed" });
          const orderConfirmed = await this.updateOrder(data.orderId, paymentData.paymentID,PaymentStatus.COMPLETED, PaymentMethod.UPI,OrderStatus.CONFIRMED);
          return orderConfirmed;
        }
      } catch (error) {
        await this.updateOrder(data.orderId,"NILL",PaymentStatus.FAILED,PaymentMethod.UPI,OrderStatus.FAILED);
        throw new Error(ERROR.FAILED_ONLINE);
      }
    }

  }



  async cancelOrder(orderId: string) {
    try {
      const cancelledOrder = await this.OrderSchema.findById(orderId);
      if (!cancelledOrder) {
        throw new NotFoundException(ERROR.NOT_EXIST);
      }
      const currentTime = Math.floor(Date.now() / 1000);
      const orderCreatedTime = new Number(cancelledOrder.timestamp);
      const difference = currentTime - orderCreatedTime.valueOf();
      if ((difference) > 60) {
        throw new RequestTimeoutException(ERROR.CANNOT_CANCEL);
      }
      cancelledOrder.status = OrderStatus.CANCELLED;
      await cancelledOrder.save();
      return { "cancelled": cancelledOrder };
    }
    catch (error) {
      throw new InternalServerErrorException(ERROR.FAILED_CANCEL);
    }

  }

  async getOrder(orderId: any) {
    try {
      const order = await this.OrderSchema.findById(orderId);
      if (!order) {
        throw new NotFoundException(ERROR.NOT_EXIST);
      }
      return order;
    }
    catch (error) {
      throw new InternalServerErrorException(ERROR.FAILED_TO_FIND);
    }
  }

  async getAllOrder(userId: string, query) {
    try {
      const skip = ((query.page) - 1) * (query.limit);
      const allOrder = await this.OrderSchema.find({ userId: userId })
        .skip(skip)
        .limit(query.limit)
        .sort({ createdAt: 1 });
      if (!allOrder) {
        throw new NotFoundException(ERROR.NOT_EXIST);
      }
      return allOrder;
    }
    catch (error) {
      throw new InternalServerErrorException(ERROR.FAILED_TO_FIND);
    }

  }
  async getManagerId(restaurantId){
      try{
        const data= await this.connection.collection(this.roleCollections.RESTAURANT).findOne({_id: new ObjectId( restaurantId)});
         if(!data){
           throw new NotFoundException(ERROR.NO_REST);
         }
         return {"managerId":data.managerId};
      }
      catch(error){
         throw new NotFoundException(ERROR.FAILED_MANAGER);
      }
  } 

  async handleDelivery(payload: { orderId: string }) {
    await this.kafkaService.handleEvent('newOrder', payload);
  }
  async handleCart(payload: { userId: string }) {
    await this.kafkaService.handleEvent('orderCreated', payload);

  }
  async handleKitchen(payload: { cartId: ObjectId }) {
    return await this.kafkaService.handleMessage('isFoodAvailable', payload);
  }
  @EventPattern('deliveryPatenerResponse')
  async deliveryAssigned(@Payload() payload: any, @Ctx() context: KafkaContext){
    const consumer = context.getConsumer();
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;

    await consumer.commitOffsets([
      {
        topic,
        partition,
        offset: (Number(offset) + 1).toString(),
      }
    ]);
    console.log(payload);
  }

  async generateInvoice(orderId: string, options: any = {},request:any): Promise<Buffer> {
    const startTime = Date.now();
    const order = await this.OrderSchema.findOne({_id:orderId,userId:request.sub});
    if (!order || !orderId) {
      throw new Error(ERROR.FAILED_TO_FIND);
    }
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        ...options.browserOptions
      });

  
      const page = await browser.newPage();

      await page.setExtraHTTPHeaders({
        'Content-Security-Policy': "default-src 'self'"
      });


      const html = this.generateInvoiceHTML(order,request);
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfOptions = {
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true,
        preferCSSPageSize: true,
        ...options.pdfOptions
      };
    
      const pdfBuffer = await page.pdf(pdfOptions);
      if (options.debug) {
        const outputDir = path.join(__dirname, '..', '..', 'invoices');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(outputDir, `invoice_${order._id}.pdf`);
        fs.writeFileSync(outputPath, pdfBuffer);
        console.log(`Invoice saved to ${outputPath}`);
      }
      return pdfBuffer;

    } catch (err) {
      throw new InternalServerErrorException(ERROR.FAILED_INVOICE);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

private generateInvoiceHTML(order: any,request:any): string {
    return `
        <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Invoice</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 40px;
                background-color: #f4f4f4;
              }

              .invoice-box {
                max-width: 800px;
                margin: auto;
                padding: 30px;
                background: #fff;
                color: #333;
                border: 1px solid #eee;
              }

              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
              }

              .logo img {
                height: 60px;
              }

              .invoice-title {
                font-size: 32px;
                color: green;
                font-weight: bold;
              }

              .section {
                margin-top: 20px;
              }

              .section strong {
                display: inline-block;
                min-width: 120px;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 30px;
              }

              th, td {
                border: 1px solid #ddd;
                padding: 10px;
                text-align: center;
              }

              th {
                background-color: #008000;
                color: white;
              }

              .totals {
                margin-top: 30px;
                text-align: right;
              }

              .totals div {
                margin: 5px 0;
              }wait this.handleCart({ userId: request.sub});

              .totals .grand-total {
                background-color: #008000;
                color: white;
                font-weight: bold;
                padding: 10px;
              }

              .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 12px;
                color: #777;
              }

              .food-image {
                width: 100%;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="invoice-box">
              <div class="header">
                <div class="logo">
                  <img src="" alt="Logo">
                </div>
                <div class="invoice-title">Invoice</div>
              </div>
              <div class="section">
                <div><strong>Bill To:</strong>${request.email}</div>
                <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
                <div><strong>Receipt No:</strong> ${order._id.toString()}</div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                  </tr>
                `).join('')}
                </tbody>
              </table>

              <div class="totals">
                <div><strong>Sub Total:</strong> ${order.subtotal}</div>
                <div><strong>Discount:</strong> ${order.discount}</div>
                <div><strong>Tax:</strong>${order.tax}%</div>
                <div class="grand-total">Grand Total: ${order.total}</div>
              </div>

              <img class="food-image" src="https://www.georgeinstitute.org/sites/default/files/styles/image_ratio_2_1_large/public/2020-10/world-food-day-2020.png.webp?itok=-h1y_Rz0" alt="Food Image">

              <div class="footer">
                Thank you for your business! <br>
                www.yourwebsite.com | support@example.com
              </div>
            </div>
          </body>
          </html>`;
  }
}

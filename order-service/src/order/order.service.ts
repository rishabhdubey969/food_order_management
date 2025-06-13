import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException, RequestTimeoutException } from '@nestjs/common';
import { InjectConnection, InjectModel, ParseObjectIdPipe } from '@nestjs/mongoose';
import mongoose, { Connection, Model, Mongoose, Types} from 'mongoose';
import { ObjectId } from 'mongodb';
import { Address, Order, OrderStatus, PaymentMethod, PaymentStatus, ProductItem } from 'src/schema/order.schema';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';



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
        const items:Array<object>=[];
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
          // console.log(cartId);
          const cartData = await this.connection.collection(this.roleCollections.CART).findOne({ _id:cartId });
          if (!cartData) {
            throw new NotFoundException('Cart not found');
          }
          if (!cartData.items || cartData.items.length === 0) {
            throw new BadRequestException('Cart is empty');
          }
      
          // modification of cart id in processing phase
          // cartData.deleted=true;
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
    
          return {"orderId":orderCreated._id};
      
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
                    paymentId:paymentId,
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
            return {"orderInfo":updatedOrder};
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
            await cancelledOrder.save();
            return {"cancelled":cancelledOrder};
          } 
          catch (error){
            throw error;
          }

    }

    async getOrder(orderId:any){
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

    async generateInvoice(orderId:string, options: any = {}): Promise<Buffer> {
      const order=await this.OrderSchema.findById(orderId);
      if (!order || !orderId) {
        throw new Error('Invalid order data');
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
  
        const html = this.generateInvoiceHTML(order);
  
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
        console.error('Error generating invoice:', err);
        throw new InternalServerErrorException('Failed to generate invoice');
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    }
    
    private generateInvoiceHTML(order: any): string {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice #${order._id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .logo { height: 50px; }
            .invoice-title { font-size: 24px; font-weight: bold; }
            .details { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; text-align: right; }
            .footer { margin-top: 50px; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <img class="logo" src="https://via.placeholder.com/150x50?text=Company+Logo" alt="Logo">
            <div class="invoice-title">INVOICE</div>
          </div>
  
          <div class="details">
            <div><strong>Invoice #:</strong> ${order._id}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
          </div>
  
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
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
  
          <div class="total">
            <strong>Total: $${order.total.toFixed(2)}</strong>
          </div>
  
          <div class="footer">
            Thank you for your business!<br>
            Questions? Email support@example.com
          </div>
        </body>
        </html>
      `;
    }
}

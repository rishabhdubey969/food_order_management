import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException, RequestTimeoutException } from '@nestjs/common';
import { InjectConnection, InjectModel, ParseObjectIdPipe } from '@nestjs/mongoose';
import mongoose, { Connection, Model, Mongoose, MongooseError, Types } from 'mongoose';
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
    RESTAURANT: 'restaurants',
  };
  constructor(@InjectModel(Order.name) private OrderSchema: Model<Order>,
    @InjectConnection() private readonly connection: Connection,
    ) {}

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
  async createUserAddress(ADDRESS: any) {
    const address = new Address();
    address.address = ADDRESS.address || ADDRESS.address_location_1;
    address.contactNumber = ADDRESS.phone || '9676534567';
    address.email = ADDRESS.email || 'abc1@gmail.com';
    address.latitude = ADDRESS.latitude
    address.longitude = ADDRESS.longitude;
  }
  async createOrder(cartId) {
    const startTime = Date.now();
    try {
      const cartData = await this.connection.collection(this.roleCollections.CART).findOne({ _id: cartId });
  
      if (!cartData) {
        throw new NotFoundException('Cart not found');
      }
      if (!cartData.items || cartData.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      const items = this.createItems(cartData.items);
      const restaurantData = await this.connection.collection(this.roleCollections.RESTAURANT).findOne({ _id: new ObjectId(cartData.restaurantId) });
      
      if (!restaurantData) {
        throw new NotFoundException('Restaurant not found');
      }
      const restaurantAddress = this.createRestaurantAddress(restaurantData);
      const userAddressData = await this.connection.collection(this.roleCollections.USER)
        .findOne({ user_id: cartData.userId });
     
      if (!userAddressData) {
        throw new NotFoundException('User address not found');
      }
      const userAddress = this.createUserAddress(userAddressData);
      

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
        timestamp: epochSeconds,
      });

      return { "orderId": orderCreated._id };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create order');
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
        throw new NotFoundException('Order not found');
      }
      return { "orderInfo": updatedOrder };
    } catch (error) {
      if(error instanceof NotFoundException){
        throw error
      }
      throw new InternalServerErrorException('Failed to update order');
    }
  }

  async cancelOrder(orderId: string) {
    try {
      const cancelledOrder = await this.OrderSchema.findById(orderId);
      if (!cancelledOrder) {
        throw new NotFoundException('Order not found');
      }
      const currentTime = Math.floor(Date.now() / 1000);
      const orderCreatedTime = new Number(cancelledOrder.timestamp);
      const difference = currentTime - orderCreatedTime.valueOf();
      if ((difference) > 60) {
        throw new RequestTimeoutException("cannot cancel order");
      }
      cancelledOrder.status = OrderStatus.CANCELLED;
      await cancelledOrder.save();
      return { "cancelled": cancelledOrder };
    }
    catch (error) {
      throw new InternalServerErrorException('Failed to cancel order');
    }

  }

  async getOrder(orderId: any) {
    try {
      const order = await this.OrderSchema.findById(orderId);
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      return order;
    }
    catch (error) {
      throw new InternalServerErrorException('Failed to find order');
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
        throw new NotFoundException('order does not exits');
      }
      return allOrder;
    }
    catch (error) {
      throw new InternalServerErrorException('Failed to find order');
    }

  }
  async getUserId(orderId: string) {
   try{ 
    const order = await this.OrderSchema.findById(orderId);
     console.log(order);
     if (!order) {
      throw new Error('Order not found');
    }
  
    return { userId: order.userId };
    }
    catch(err){
      throw new InternalServerErrorException('Failed to find user');
    }
  }

  async generateInvoice(orderId: string, options: any = {}): Promise<Buffer> {
    const startTime=Date.now();
    const order = await this.OrderSchema.findById(orderId);
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
              }

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
                <div><strong>Bill To:</strong>${order.deliveryAddress.address.toString()}</div>
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

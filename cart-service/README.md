# 🛒 Cart Service – Food Order Management System

The **Cart Service** is a core microservice in the Food Order Management platform. It allows users to manage their shopping carts by adding items, modifying quantities, applying/removing coupons, and calculating totals including taxes and delivery charges.

---

## 📚 Features Overview

| Feature                   | Description                                                                  |
|---------------------------|------------------------------------------------------------------------------|
| ➕ Add Item to Cart        | Add a menu item to the cart and auto-increment if it already exists          |
| ➖ Remove Item             | Decrease quantity or remove an item entirely from the cart                   |
| 🆕 Update Cart            | Replace or update multiple items in the cart with new quantities             |
| ❌ Delete Cart            | Manually or automatically delete the cart if it becomes empty                |
| 🧾 View Cart              | View all items in the cart with latest price, tax, and availability info     |
| 🏷️ Apply/Remove Coupon   | Apply or remove a coupon, recalculate discount and totals                    |
| 🏬 View Available Coupons | Fetch all valid and active coupons for a restaurant                         |
| 📍 Distance-Based Charges | Calculates delivery charges using Haversine formula from Redis-cached address |

---

## 🚀 Tech Stack

| Tech           | Purpose                                       |
|----------------|-----------------------------------------------|
| 🧠 **NestJS**     | Backend framework                            |
| 🐳 **MongoDB**    | Cart data persistence                        |
| 📍 **Redis**      | Caching user geo-coordinates                 |
| 🧾 **Swagger**    | API documentation                            |
| 🛡️ **gRPC**       | Auth communication via microservices         |
| 🔐 **JWT (via gRPC)** | User auth guard using gRPC-based token validation |
| 🛠️ **Winston**    | Centralized logging                          |
| 🧵 **Kafka**      | Event streaming and pub/sub messaging       |


---

## 📦 API Endpoints

| Method | Route                          | Description                                     |
|--------|--------------------------------|-------------------------------------------------|
| POST   | `/cart/add`                    | Add item to cart (increment if exists)          |
| POST   | `/cart/remove`                 | Decrease quantity or remove item from cart      |
| POST   | `/cart/updateCart`             | Replace cart items with new data                |
| DELETE | `/cart/delete`                 | Delete user’s active cart                       |
| GET    | `/cart/get`                    | Retrieve user’s cart with latest validation     |
| GET    | `/cart/coupons/:restaurantId`  | Fetch all valid coupons for a restaurant        |
| POST   | `/cart/applyCoupon/:couponId`  | Apply a coupon to the cart                      |
| POST   | `/cart/removeCoupon`           | Remove applied coupon from the cart             |

> Full Swagger documentation available at `/api`

---

## 🧠 Key Logic & Helpers

| Method                   | Purpose                                                                 |
|--------------------------|-------------------------------------------------------------------------|
| `calculateDistance()`    | Computes distance (in KM) between user and restaurant (Haversine formula) |
| `calculateDeliveryCharges()` | ₹5 per km distance charge; uses Redis geo-coordinates              |
| `calculateTax()`         | Calculates 5% tax on item total                                         |
| `calculateCartTotals()`  | Combines item total, tax, delivery charges, platform fee, discount     |
| `validateCart()`         | In GET API – removes invalid/unavailable items, updates prices/taxes   |
| `validateCoupon()`       | Ensures coupon exists, is active, not expired, and matches cart rules  |


---

## 📦 Sample Cart JSON

```json
{
    "_id": "685456555d88a5efcacf2000",
    "userId": "684d51abab85e4eea0290000",
    "deliveryCharges": 8690,
    "distanceInKm": 1737.94,
    "itemTotal": 7000,
    "items": [
        {
            "itemId": "684acd94e22a8c3658c40000",
            "name": "Paneer",
            "quantity": 3,
            "price": 1000,
            "tax": 150
        },
        {
            "itemId": "684acd94e22a8c3658c40000",
            "name": "Briyani",
            "quantity": 4,
            "price": 1000,
            "tax": 200
        }
    ],
    "platformFee": 9,
    "restaurantId": "684ab19bd5e1127595270000",
    "subtotal": 7000,
    "tax": 350,
    "total": 16049,
    "couponCode": null,
    "couponId": null,
    "discount": 0
}



---

### 🛠️ 1. Clone the Repository

```bash
git clone https://github.com/your-org/food-order-management.git
cd food-order-management
```

## 📦 2. Install Dependencies For Service
Each service is located inside the services/ folder. To run any service, you must install its dependencies separately.

```bash
cd cart-service   
npm install

```

### ▶️ 3. Run  Service

To run a service in development mode:

```bash
cd cart-service  
npm run start:dev

```

### 🔐 4. Environment Setup (.env files)
Each service requires its own .env file located in its root directory.

## 📄 Example: services/auth/.env

```bash
PORT=3002
MONGO_URI=mongodb://localhost:27017/cart-db
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKER=localhost:9092




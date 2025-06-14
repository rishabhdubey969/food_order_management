# food_order_management
This web-based application automates the food ordering process for customers, restaurant staff, and administrators.
# 🍽️ Food Order Management System

A scalable, microservices-based food ordering platform built using **NestJS**, **Express**, **Kafka**, **MongoDB**, **Redis**, and **RabbitMQ**.

---

## 🧩 Microservices Overview

| Service           | Description                            |
|-------------------|----------------------------------------|
| 🔐 **Auth**        | User authentication with JWT           |
| 👤 **User**        | User profile management                |
| 💳 **Payment**     | Handles payments and transactions      |
| 🧾 **Order**       | Order processing and tracking          |
| 🚚 **Delivery**    | Manages delivery logistics             |
| 🛒 **Cart**        | Shopping cart functionality            |
| 🍽️ **Restaurant** | Menu and restaurant management         |
| 🧑‍💼 **Admin**      | Admin operations and dashboards        |
| 🔔 **Notification**| Email/SMS/push notification service    |
| 🖼️ **Media**       | File and image upload service          |
| ⭐ **Rating**      | Ratings and reviews system             |

---

## 🚀 Tech Stack

| Technology     | Purpose                                      |
|----------------|----------------------------------------------|
| 🧠 **NestJS**     | Modular backend services                    |
| ⚡ **ExpressJS**  | Lightweight REST services                   |
| 🐳 **MongoDB**    | NoSQL database                              |
| 🧵 **Kafka**      | Event streaming and pub/sub messaging       |
| 📮 **RabbitMQ**   | Queue system for async operations           |
| 🔐 **JWT**        | Secure user authentication                 |
| 🚀 **Redis**      | Caching and session store                  |

---

## ⚙️ Setup Instructions

---

### 🛠️ 1. Clone the Repository

```bash
git clone https://github.com/your-org/food-order-management.git
cd food-order-management
```

## 📦 2. Install Dependencies Per Service
Each service is located inside the services/ folder. To run any service, you must install its dependencies separately.

```bash
cd services/<service-name>   # e.g. auth, user, order
npm install

```

### ▶️ 3. Run Any Service

To run a service in development mode:

```bash
cd services/<service-name>   # e.g. services/auth
npm run start:dev

```

### 🔐 4. Environment Setup (.env files)
Each service requires its own .env file located in its root directory.

## 📄 Example: services/auth/.env

```bash
PORT=3001
JWT_SECRET=your_jwt_secret
MONGO_URI=mongodb://localhost:27017/auth-db
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKER=localhost:9092
RABBITMQ_URI=amqp://localhost

```

## 📬 Contact

```bash
For questions or support, reach out to: supportfoodapp@yopmail.com

```


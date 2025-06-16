<h1 align="center">🍽️ Manager and Restaurant Service – Food Order Management</h1>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

<p align="center">
  <b>A robust user authentication and management microservice for the Food Order Management platform</b>
</p>

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Testing](#-testing)
- [Contributing](#-contributing)

## 🔍 Overview
The Manager and Restaurant Service is the backbone of the Food Order Management system, handling:
- Restaurant management and operations
- Manager authentication and authorization
- Menu and coupon management
- Order processing and status updates
- Complaint resolution system

## ✨ Features

### Manager Module
- 🔐 JWT-based authentication (signup/login/logout)
- 👤 Manager profile management
- 🚦 Order handover processing
- 📝 Complaint management system

### Restaurant Module
- 🏢 Restaurant CRUD operations
- 📍 Nearby restaurant discovery
- 🍔 Menu item management
- 🏷️ Tag-based restaurant filtering
- 🎟️ Coupon creation and management
- 🔍 Advanced search functionality

## 🛠 Tech Stack
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** MongoDB
- **Authentication:** JWT with role-based guards
- **API Documentation:** Swagger/OpenAPI
- **Inter-service Communication:** gRPC
- **File Storage:** AWS S3 (via signed URLs)

## 📋 Prerequisites
- Node.js (v16+)
- MongoDB (v4.4+)
- npm/yarn
- AWS S3 bucket (for media storage)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/food_order_management.git
   cd food_order_management/manager-restaurant-service
   ```

2. **Install dependencies**

```bash
   npm install

```

3. **Build the project**

```bash
   npm run build

```

4. ## Start the service

   # Development

```bash
   npm run start:dev

```

# Production

```bash
   npm run start:prod

```

## ⚙️ Environment Setup

Create a .env file in the root directory:

# Application

```bash
PORT=3005
NODE_ENV=development

```

# Database

```bash
MONGODB_URI=mongodb://localhost:27017/food_order_management

```

# JWT Authentication

```bash
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

```

## 📚 API Documentation

Authentication Endpoints

1. **Manager Registration**

```bash
 POST /manager/signup
Content-Type: application/json

{
  "email": "manager@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "restaurantId": "507f1f77bcf86cd799439011"
}

2. **Manager Login**

```bash
POST /manager/login
Content-Type: application/json

{
"email": "user@example.com",
"password": "SecurePass123!",
}

```

3. **Forgot Password**

```bash
POST /auth/forgot-password
Content-Type: application/json

{
"email": "user@example.com"
}

```
3.. **Manager Logout**

```bash
POST /manager/logout
Content-Type: application/json

{
"email": "user@example.com",
"password": "SecurePass123!",
}

```

4. **Get Manager by id**

```bash
   POST /manager/:id
   Content-Type: application/json

{
"id": "684aaacfe5cb70eafaf11754"
}

```
5.**Update Manager by id**

```bash
PUT /manager/update/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```
6.**Order HandOver**
```bash
POST /manager/orderHandOver
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "orderId": "507f1f77bcf86cd799439011"
}
```
7.**Create Complain**
```bash
### 1. Create Complaint
`POST /:managerId`

**Description**: Create a new complaint (User only)

**Request Body**:
```json
{
  "userId": "682adb9df49146b3a410e478",
  "orderId": "683d8e4d15f9ab39583eef4f",
  "description": "The food was delivered late and was cold."
}
```
8.**Update complain status by manageer**
```bash
PATCH /complaints/status/507f1f77bcf86cd799439012
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}
```
9.**Get all Complains for specific manager**
```bash
GET /complaints/manager/507f1f77bcf86cd799439011
Authorization: Bearer <JWT_TOKEN>
```
10.**Get all complain by admin**
```bash
GET /complaints/admin
Authorization: Bearer <ADMIN_JWT_TOKEN>
```
## 💻 Development

# Run in development mode

```bash
npm run start:dev

```

# Generate API documentation

```bash
npm run doc:generate

```

# Lint code

```bash
npm run lint

```

# Format code

```bash
npm run format

```

# 🧪 Testing# Unit tests

```bash
npm run test

```

# e2e tests

```bash
npm run test:e2e

```

# Test coverage

```bash
npm run test:cov

```

## 🤝 Contributing

**Fork the repository**
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

## 📝 Error Handling

The service implements a global error handling mechanism with standardized error responses:

```bash
{
"status": number,
"message": string,
"error": string,
"timestamp": string
}

```

## 🔒 Security

Password hashing using bcrypt
JWT token-based authentication
Input validation and sanitization
CORS protection

## 📈 API Response Format

```bash
Success Response:
{
"status": "success",
"data":
{
// Response data
}
}

```

```bash
Error Response:
{
"status": "error",
"message": "Error message",
"code": "ERROR_CODE"
}

```

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

<p align="center">Made with ❤️ by Your Adrisha Gupta and Kushagra</p>
<h1 align="center">🔐 Auth Service – Food Order Management</h1>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

<p align="center">
  <b>Authentication and authorization microservice for the Food Order Management platform</b>
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
- [Error Handling](#-error-handling)
- [Security](#-security)
- [API Response Format](#-api-response-format)
- [License](#-license)

## 🔍 Overview

The Auth Service is responsible for all authentication and authorization operations in the Food Order Management system. It manages user registration, login, password management, OTP verification, and JWT-based session handling.

## ✨ Features

- 🔐 User authentication (login/logout)
- 🛡️ JWT-based authorization
- 👤 Token refresh endpoint

## 🛠 Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** MongoDB
- **Authentication:** JWT
- **Email Service:** Nodemailer
- **Validation:** class-validator
- **Documentation:** Swagger/OpenAPI

## 📋 Prerequisites

- Node.js (v14+)
- MongoDB (v4+)
- npm/yarn
- Git

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/food_order_management.git
   cd food_order_management/auth-service
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the project**

   ```bash
   npm run build
   ```

4. **Start the service**

   - Development

     ```bash
     npm run start:dev
     ```

   - Production

     ```bash
     npm run start:prod
     ```

## ⚙️ Environment Setup

Create a `.env` file in the root directory:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/food_order_management

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@yourapp.com

# OTP Configuration
OTP_EXPIRY=5 # minutes
```

## 📚 API Documentation

### Authentication Endpoints

- **Login**

  ```http
  POST /auth/login
  Content-Type: application/json

  {
    "email": "user@example.com",
    "password": "SecurePass123!"
  }
  ```

  ```

  ```

- **Refresh Token**

  ```http
  POST /auth/refresh-token
  Content-Type: application/json

  {
    "refreshToken": "your_refresh_token"
  }
  ```

## 💻 Development

- **Run in development mode**

  ```bash
  npm run start:dev
  ```

- **Generate API documentation**

  ```bash
  npm run doc:generate
  ```

- **Lint code**

  ```bash
  npm run lint
  ```

- **Format code**

  ```bash
  npm run format
  ```

## 🧪 Testing

- **Unit tests**

  ```bash
  npm run test
  ```

- **e2e tests**

  ```bash
  npm run test:e2e
  ```

- **Test coverage**

  ```bash
  npm run test:cov
  ```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Error Handling

The service implements global error handling with standardized error responses:

```json
{
  "status": number,
  "message": string,
  "error": string,
  "timestamp": string
}
```

## 🔒 Security

- Password hashing using bcrypt
- JWT token-based authentication
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS protection
- Refresh token rotation

## 📈 API Response Format

**Success Response:**

```json
{
  "status": "success",
  "data": {
    // Response data
  }
}
```

**Error Response:**

```json
{
  "status": "error",
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

<p align="center">Made with ❤️ by Rishabh Dubey</p>

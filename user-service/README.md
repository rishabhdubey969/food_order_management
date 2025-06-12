<h1 align="center">🍽️ User Service – Food Order Management</h1>

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

The User Service is a critical component of our Food Order Management system, handling all user-related operations including authentication, registration, and profile management.

## ✨ Features

- 🔐 User Authentication
- 📝 User Registration with OTP Verification
- 🔄 Password Reset Functionality
- 👤 User Profile Management
- 📧 Email Notifications
- 🛡️ JWT Based Authorization

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
   cd food_order_management/user-service

   ```

2. Install dependencies
   npm install

3. Build the project
   npm run build

4. Start the service

   # Development

   npm run start:dev

   # Production

   npm run start:prod

⚙️ Environment Setup
Create a .env file in the root directory:

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

GitHub Copilot
Install dependencies

Build the project

Start the service

⚙️ Environment Setup
Create a .env file in the root directory:

📚 API Documentation
Authentication Endpoints

1. Send OTP

GitHub Copilot
Install dependencies

Build the project

Start the service

⚙️ Environment Setup
Create a .env file in the root directory:

📚 API Documentation
Authentication Endpoints

1. Send OTP

2. User Registration

POST /auth/signup
Content-Type: application/json

{
"email": "user@example.com",
"password": "SecurePass123!",
"name": "John Doe",
"otp": "123456"
}

3. Forgot Password

POST /auth/forgot-password
Content-Type: application/json

{
"email": "user@example.com"
}

4. Reset Password
   POST /auth/reset-password/:token
   Content-Type: application/json

{
"password": "NewSecurePass123!"
}

💻 Development

# Run in development mode

npm run start:dev

# Generate API documentation

npm run doc:generate

# Lint code

npm run lint

# Format code

npm run format

🧪 Testing# Unit tests
npm run test

# e2e tests

npm run test:e2e

# Test coverage

npm run test:cov

🤝 Contributing
Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

📝 Error Handling
The service implements a global error handling mechanism with standardized error responses:
{
"status": number,
"message": string,
"error": string,
"timestamp": string
}

🔒 Security
Password hashing using bcrypt
JWT token-based authentication
Rate limiting on sensitive endpoints
Input validation and sanitization
CORS protection
📈 API Response Format

Success Response:{
"status": "success",
"data": {
// Response data
}
}

Error Response:
{
"status": "error",
"message": "Error message",
"code": "ERROR_CODE"
}

📜 License
This project is licensed under the MIT License - see the LICENSE file for details.

<p align="center">Made with ❤️ by Your Rishabh Dubey</p>

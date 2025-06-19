# 🧑‍💼 Admin Service

A microservice within the Food Order Management System, built using **NestJS**, responsible for handling administrative operations, user management, manager management, and order analytics.

## 🌟 Overview

The Admin Service provides a robust backend for managing administrative tasks, including authentication, user and manager operations, and order statistics. It integrates with MongoDB for data storage, Redis for caching, and leverages JWT for secure authentication.

## 🚀 Features

### 🔐 Authentication
- **Login**: Admin login with JWT authentication.
- **Forget Password**: Initiates password reset process.
- **Reset Password**: Allows password reset with a valid token.
- **Logout**: Ends the admin session.
- **Verify OTP**: Verifies one-time password for authentication.

### 👥 User Management
- **Listing of Users**: Retrieve a list of all users.
- **Block User**: Block a user account.
- **Validate User**: Validate a user account.
- **Invalidate User**: Invalidate a user account.
- **Soft Delete User**: Soft delete a user account.

### 🧑‍💼 Manager Management
- **Listing of Managers**: Retrieve a list of all managers.
- **Block Manager**: Block a manager account.
- **Validate Manager**: Validate a manager account.
- **Invalidate Manager**: Invalidate a manager account.
- **Soft Delete Manager and Restaurant**: Soft delete a manager and associated restaurant.

### 📊 Order Analytics
- **Total Orders (Monthly)**: Get the total number of orders for the current month.
- **Total Orders (Yearly)**: Get the total number of orders for the current year.
- **Total Orders (Weekly)**: Get the total number of orders for the current week.
- **Particular Order by User ID**: Retrieve details of a specific order by user ID.

## 🚀 Tech Stack
| Technology     | Purpose                                      |
|----------------|----------------------------------------------|
| 🧠 **NestJS**     | Modular backend framework                   |
| 🐳 **MongoDB**    | NoSQL database for persistent storage       |
| 🚀 **Redis**      | Caching and session management              |
| 🔐 **JWT**        | Secure admin authentication                 |

## ⚙️ Setup Instructions

### 🛠️ 1. Clone the Repository
```bash
git clone https://github.com/your-org/food-order-management.git
cd food-order-management
```

### 📦 2. Install Dependencies
Navigate to the `admin-service` directory and install the required dependencies:
```bash
cd services/api/admin-service
npm install
```

### ▶️ 3. Run the Service
Start the admin service in development mode:
```bash
cd services/api/admin-service
npm run start:dev
```

### 🔐 4. Environment Setup
Create a `.env` file in the `services/api/admin-service` directory with the following variables:

```bash
JWT_SECRET=your-secret-key
EMAIL_USER=admin@appinventiv.com
EMAIL_PASS=your-email-password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_REFRESH_SECRET=your_refresh_token_secret
EXPIRE_REFRESH='7d'
URI='mongodb+srv://FoodOrder:FoodAdmin123@cluster0.hcogCluster0'
expiresIn='1h'
port=3000
```

### 📋 Notes
- Ensure MongoDB and Redis are running locally or update the `.env` file with the correct host and port.
- The admin user is already seeded in the database.

## 📬 Contact
For questions or support, reach out to: `supportfoodapp@yopmail.com`
# Stripe Payment Microservice

![NestJS](https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white)
![gRPC](https://img.shields.io/badge/gRPC-4285F4?style=for-the-badge&logo=google&logoColor=white)

A robust NestJS microservice for handling Stripe payments with REST and gRPC endpoints, supporting checkout sessions, payment status tracking, refunds, and webhook processing.

## Features ✨

- 💳 **Payment Processing**: Create and manage Stripe checkout sessions
- 🔍 **Payment Status Tracking**: Real-time payment status via gRPC
- ↩️ **Refund Management**: Process full or partial refunds
- 🤖 **Webhook Integration**: Secure Stripe webhook handling
- 🔄 **Retry Mechanism**: Automatic retry for failed payments
- 📊 **Transaction History**: Retrieve payment history by order ID
- 🔐 **JWT Authentication**: Secure all sensitive endpoints
- 📚 **Swagger Documentation**: Fully documented API

## Tech Stack 🛠️

- **Framework**: [NestJS](https://nestjs.com/)
- **Payment Processor**: [Stripe](https://stripe.com/)
- **API Documentation**: [Swagger](https://swagger.io/)
- **RPC Protocol**: [gRPC](https://grpc.io/)
- **Authentication**: JWT with AuthGuard

## API Endpoints 🌐

### Payment Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/payment/checkout` | POST | Create Stripe checkout session | ✅ |
| `/payment/retry` | POST | Retry failed payment | ✅ |
| `/payment/request` | POST | Request payment processing | ✅ |
| `/payment` | GET | Get transaction history | ✅ |

### Refund Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/payment/refund` | POST | Process refund | ✅ |

### Webhook Endpoint

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/payment/stripe` | POST | Stripe webhook handler | ❌ |

# Stripe Configuration (Required)
STRIPE_SECRET_KEY=your_live_or_test_secret_key,
STRIPE_WEBHOOK_SECRET=your_webhook_signing_secret,
STRIPE_API_VERSION=2023-08-16  # Recommended pinned version


# Application Configuration
PORT=3007                 
## gRPC Services 📡

```proto
service PaymentService {
  rpc GetPayStatus (PaymentStatusRequest) returns (PaymentStatusResponse);
}

message PaymentStatusRequest {
  string orderId = 1;
}



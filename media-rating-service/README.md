# 🍽️ Food Order Media & Rating Review Service

## Project Overview

This service handles media items and user ratings/reviews for the Food Order Management System. It exposes RESTful APIs to manage media (such as images of dishes) and collect user feedback through ratings and reviews.

## Setup Instructions

1. **Clone the repository:**
    ```bash
    git clone <repo-url>
    cd media-rating-service
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Start the service:**
    ```bash
    npm start
    ```

## Environment Variables

Create a `.env` file in the root directory with the following content:

```env
MONGODB_URI=mongodb://localhost:27017/media_rating_db
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

## Example API Calls

### Add Media (e.g., dish image)

```http
POST /api/media
Content-Type: application/json

{
  "title": "Margherita Pizza",
  "url": "https://example.com/margherita.jpg",
  "type": "image"
}
```

### Add Rating/Review for a Dish

```http
POST /api/ratings
Authorization: Bearer <token>
Content-Type: application/json

{
  "mediaId": "60f7c2b8e1b1c8a1d4e8b123",
  "rating": 5,
  "review": "Best pizza I've ever had!"
}
```

### Get Media with Ratings

```http
GET /api/media/60f7c2b8e1b1c8a1d4e8b123
```

### Delete a Review

```http
DELETE /api/ratings/60f7c2b8e1b1c8a1d4e8b456
Authorization: Bearer <token>
```

---

**Note:** Replace IDs and tokens with actual values.
}
```

### Get Media with Ratings

```http
GET /api/media/60f7c2b8e1b1c8a1d4e8b123
```

### Delete a Review

```http
DELETE /api/ratings/60f7c2b8e1b1c8a1d4e8b456
Authorization: Bearer <token>
```

---

**Note:** Replace IDs and tokens with actual values.

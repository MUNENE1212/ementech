# DumuWaks 2.0 - API Specification

## Overview

This document defines the complete API contract for the User-Driven Pricing System and Intelligent Review System. All endpoints follow RESTful conventions and OpenAPI 3.0 standards.

**Base URL:** `https://api.dumuwaks.co.ke/v1`

**Authentication:** Bearer Token (JWT)

**Content-Type:** `application/json`

**Response Format:**
```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "errors": [],
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

## Table of Contents

1. [Pricing System APIs](#pricing-system-apis)
2. [Review System APIs](#review-system-apis)
3. [Analytics APIs](#analytics-apis)
4. [Admin APIs](#admin-apis)

---

## Pricing System APIs

### 1. Create Pricing Configuration

**Endpoint:** `POST /providers/pricing`

**Description:** Create a new pricing configuration for a service.

**Authentication:** Required (Provider)

**Request Body:**
```json
{
  "serviceCategoryId": "507f1f77bcf86cd799439011",
  "serviceSubCategoryId": "507f1f77bcf86cd799439012",
  "serviceName": "Men's Haircut",
  "serviceDescription": "Professional men's haircut with styling",
  "pricingType": "flat",
  "flatRate": 500,
  "rateDescription": "Includes wash, cut, and styling",
  "currency": "KES",
  "location": {
    "coordinates": [36.8219, -1.2864],
    "address": {
      "street": "Ngong Road",
      "city": "Nairobi",
      "postalCode": "00100"
    },
    "serviceRadius": 10
  },
  "dynamicPricing": {
    "enabled": true,
    "rushFee": 20,
    "weekendFee": 15,
    "travelFee": 100
  },
  "discounts": {
    "newCustomerDiscount": 10
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "pricingId": "507f191e810c19729de860ea",
    "providerId": "507f1f77bcf86cd799439013",
    "pricingType": "flat",
    "currentPrice": 500,
    "isActive": true,
    "createdAt": "2026-01-18T10:30:00Z"
  },
  "message": "Pricing configuration created successfully"
}
```

**Validation Rules:**
- `flatRate` required if `pricingType === 'flat'`
- `hourlyRate` required if `pricingType === 'hourly'`
- `tiers` required if `pricingType === 'tiered'`
- `packages` required if `pricingType === 'package'`
- `coordinates` must be valid `[longitude, latitude]`

**Error Responses:**
- `400 Bad Request` - Invalid pricing data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a provider
- `409 Conflict` - Pricing already exists for this service

---

### 2. Update Pricing Configuration

**Endpoint:** `PUT /providers/pricing/:pricingId`

**Description:** Update an existing pricing configuration. Creates audit trail.

**Authentication:** Required (Provider)

**Request Body:** (Partial update allowed)
```json
{
  "flatRate": 600,
  "reason": "Increased due to higher quality products",
  "dynamicPricing": {
    "enabled": true,
    "rushFee": 25
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "pricingId": "507f191e810c19729de860ea",
    "flatRate": 600,
    "previousRate": 500,
    "version": 2,
    "updatedAt": "2026-01-18T11:30:00Z"
  },
  "message": "Pricing updated successfully"
}
```

---

### 3. Get Provider's Pricing

**Endpoint:** `GET /providers/:providerId/pricing`

**Description:** Retrieve all pricing configurations for a provider.

**Authentication:** Not required (public)

**Query Parameters:**
- `isActive` (boolean) - Filter by active status
- `serviceCategoryId` (string) - Filter by category
- `pricingType` (string) - Filter by pricing type

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "pricingId": "507f191e810c19729de860ea",
      "serviceName": "Men's Haircut",
      "pricingType": "flat",
      "flatRate": 500,
      "currency": "KES",
      "dynamicPricing": {
        "enabled": true,
        "rushFee": 20,
        "weekendFee": 15
      },
      "discounts": {
        "newCustomerDiscount": 10
      },
      "isActive": true
    },
    {
      "pricingId": "507f191e810c19729de860eb",
      "serviceName": "Massage Therapy",
      "pricingType": "hourly",
      "hourlyRate": 3000,
      "minimumHours": 1,
      "maximumHours": 4
    }
  ],
  "metadata": {
    "total": 2,
    "page": 1,
    "limit": 20
  }
}
```

---

### 4. Bulk Upload Pricing

**Endpoint:** `POST /providers/pricing/bulk`

**Description:** Upload multiple pricing configurations at once.

**Authentication:** Required (Provider)

**Request Body:**
```json
{
  "pricing": [
    {
      "serviceName": "Men's Haircut",
      "pricingType": "flat",
      "flatRate": 500
    },
    {
      "serviceName": "Beard Trim",
      "pricingType": "flat",
      "flatRate": 200
    },
    {
      "serviceName": "Massage",
      "pricingType": "tiered",
      "tiers": [
        {
          "tierName": "basic",
          "displayName": "Swedish Massage",
          "price": 2500,
          "duration": 60
        },
        {
          "tierName": "premium",
          "displayName": "Deep Tissue",
          "price": 3500,
          "duration": 90
        }
      ]
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "created": 3,
    "failed": 0,
    "pricingIds": [
      "507f191e810c19729de860ea",
      "507f191e810c19729de860eb",
      "507f191e810c19729de860ec"
    ]
  },
  "message": "3 pricing configurations created successfully"
}
```

---

### 5. Get Market Rate Suggestions

**Endpoint:** `GET /providers/pricing/suggestions`

**Description:** Get market rate data to help providers set competitive prices.

**Authentication:** Required (Provider)

**Query Parameters:**
- `serviceCategoryId` (string, required) - Service category
- `location` (string) - City name or coordinates
- `experienceLevel` (string) - Provider experience level

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "serviceCategory": "Barber",
    "location": "Nairobi",
    "sampleSize": 150,
    "statistics": {
      "minimumPrice": 300,
      "maximumPrice": 1000,
      "averagePrice": 520,
      "medianPrice": 500,
      "percentile25": 400,
      "percentile75": 650
    },
    "suggestions": {
      "newProvider": {
        "recommended": 450,
        "range": "400-500",
        "reason": "Lower prices help build initial customer base"
      },
      "experiencedProvider": {
        "recommended": 600,
        "range": "550-700",
        "reason": "Higher prices reflect experience and quality"
      }
    },
    "qualityBased": [
      {
        "ratingTier": "4.5-4.8",
        "averagePrice": 650
      },
      {
        "ratingTier": "4.8+",
        "averagePrice": 800
      }
    ],
    "lastUpdated": "2026-01-18T00:00:00Z"
  }
}
```

---

### 6. Calculate Price Estimate

**Endpoint:** `POST /services/estimate`

**Description:** Get price estimate for a service before booking.

**Authentication:** Not required (public)

**Request Body:**
```json
{
  "providerId": "507f1f77bcf86cd799439013",
  "servicePricingId": "507f191e810c19729de860ea",
  "pricingType": "flat",
  "bookingDate": "2026-01-20T14:00:00Z",
  "duration": 60,
  "location": {
    "coordinates": [36.8219, -1.2864],
    "address": "Westlands, Nairobi"
  },
  "isRush": true,
  "isWeekend": true,
  "isNewCustomer": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "basePrice": 500,
    "adjustments": [
      {
        "type": "rush_fee",
        "amount": 100,
        "percentage": 20,
        "description": "Same-day rush service"
      },
      {
        "type": "weekend_fee",
        "amount": 75,
        "percentage": 15,
        "description": "Weekend service premium"
      },
      {
        "type": "new_customer_discount",
        "amount": -50,
        "percentage": -10,
        "description": "First-time customer discount"
      }
    ],
    "totalPrice": 625,
    "currency": "KES",
    "breakdown": {
      "subtotal": 675,
      "discount": 50,
      "total": 625
    },
    "estimatedDuration": 60,
    "validUntil": "2026-01-18T12:00:00Z"
  }
}
```

---

### 7. Search Providers by Pricing

**Endpoint:** `GET /services/search`

**Description:** Search for service providers with pricing filters.

**Authentication:** Not required (public)

**Query Parameters:**
- `serviceCategoryId` (string, required)
- `location` (string, required) - "lat,lng" or city name
- `minPrice` (number)
- `maxPrice` (number)
- `sortBy` (enum: price_asc, price_desc, rating_desc, distance)
- `radius` (number) - Search radius in km (default: 10)

**Example:** `GET /services/search?serviceCategoryId=barber&location=-1.2864,36.8219&minPrice=300&maxPrice=700&sortBy=price_asc`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "providerId": "507f1f77bcf86cd799439013",
      "providerName": "John's Barbershop",
      "profileImage": "https://s3.dumuwaks.co.ke/providers/...",
      "rating": {
        "average": 4.7,
        "count": 156
      },
      "pricing": [
        {
          "serviceName": "Men's Haircut",
          "pricingType": "flat",
          "flatRate": 400,
          "currency": "KES"
        }
      ],
      "location": {
        "address": "Westlands, Nairobi",
        "distance": 2.3
      },
      "availability": {
        "nextAvailable": "2026-01-18T14:00:00Z"
      }
    }
  ],
  "metadata": {
    "total": 15,
    "page": 1,
    "limit": 20
  }
}
```

---

### 8. Get Pricing History

**Endpoint:** `GET /providers/:providerId/pricing/history`

**Description:** Get audit trail of price changes.

**Authentication:** Required (Provider or Admin)

**Query Parameters:**
- `pricingId` (string) - Filter by specific pricing
- `startDate` (date)
- `endDate` (date)
- `changeType` (string) - created, updated, deleted

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "historyId": "507f191e810c19729de860f0",
      "pricingId": "507f191e810c19729de860ea",
      "changeType": "updated",
      "previousState": {
        "flatRate": 500
      },
      "newState": {
        "flatRate": 600
      },
      "changedFields": [
        {
          "fieldName": "flatRate",
          "oldValue": 500,
          "newValue": 600
        }
      ],
      "reason": "Increased due to higher quality products",
      "changedBy": "507f1f77bcf86cd799439013",
      "changedAt": "2026-01-18T11:30:00Z"
    }
  ],
  "metadata": {
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

---

## Review System APIs

### 9. Submit Review

**Endpoint:** `POST /reviews`

**Description:** Submit a review for a completed booking.

**Authentication:** Required (Customer)

**Request Body:**
```json
{
  "bookingId": "507f1f77bcf86cd799439014",
  "overallRating": 5,
  "categoryRatings": {
    "punctuality": 5,
    "quality": 5,
    "professionalism": 4,
    "communication": 5,
    "value": 5
  },
  "title": "Excellent service!",
  "comment": "Very professional and skilled barber. Highly recommend!",
  "pros": [
    "On time",
    "Great haircut",
    "Clean shop"
  ],
  "photos": [
    "https://s3.dumuwaks.co.ke/reviews/..."
  ],
  "source": "mobile_app"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "reviewId": "507f191e810c19729de860ff",
    "bookingId": "507f1f77bcf86cd799439014",
    "overallRating": 5,
    "status": "submitted",
    "incentive": {
      "type": "discount_100",
      "amount": 100,
      "description": "KES 100 off your next booking",
      "code": "REVIEW100",
      "expiresAt": "2026-02-18T00:00:00Z"
    },
    "submittedAt": "2026-01-18T15:30:00Z"
  },
  "message": "Thank you for your review! Enjoy KES 100 off your next booking."
}
```

**Validation Rules:**
- `overallRating` required (1-5)
- `bookingId` must exist and belong to authenticated customer
- Booking status must be 'completed'
- One review per booking (enforced at database level)
- Photos optional (max 5)

**Error Responses:**
- `400 Bad Request` - Invalid rating data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not the customer who made the booking
- `409 Conflict` - Review already exists for this booking
- `404 Not Found` - Booking not found

---

### 10. Get Provider Reviews

**Endpoint:** `GET /providers/:providerId/reviews`

**Description:** Get all reviews for a specific provider.

**Authentication:** Not required (public)

**Query Parameters:**
- `minRating` (number) - Filter by minimum rating
- `maxRating` (number) - Filter by maximum rating
- `sortBy` (enum: recent, helpful, highest, lowest)
- `page` (number) - Default 1
- `limit` (number) - Default 20, max 100

**Example:** `GET /providers/507f1f77bcf86cd799439013/reviews?minRating=4&sortBy=helpful`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "provider": {
      "providerId": "507f1f77bcf86cd799439013",
      "providerName": "John's Barbershop",
      "averageRating": 4.7,
      "totalReviews": 156
    },
    "reviews": [
      {
        "reviewId": "507f191e810c19729de860ff",
        "customer": {
          "name": "Muent K.",
          "initials": "MK"
        },
        "overallRating": 5,
        "categoryRatings": {
          "punctuality": 5,
          "quality": 5,
          "professionalism": 4
        },
        "title": "Excellent service!",
        "comment": "Very professional and skilled barber.",
        "photos": ["https://s3.dumuwaks.co.ke/reviews/..."],
        "helpfulVotes": 23,
        "notHelpfulVotes": 2,
        "providerResponse": {
          "response": "Thank you so much! Looking forward to seeing you again.",
          "respondedAt": "2026-01-18T16:00:00Z"
        },
        "serviceType": "Men's Haircut",
        "serviceDate": "2026-01-15T14:00:00Z",
        "submittedAt": "2026-01-18T15:30:00Z"
      }
    ],
    "ratingDistribution": {
      "5": 120,
      "4": 25,
      "3": 8,
      "2": 2,
      "1": 1
    },
    "metadata": {
      "total": 156,
      "page": 1,
      "limit": 20
    }
  }
}
```

---

### 11. Get Customer's Reviews

**Endpoint:** `GET /customers/reviews`

**Description:** Get all reviews submitted by the authenticated customer.

**Authentication:** Required (Customer)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "reviewId": "507f191e810c19729de860ff",
      "providerName": "John's Barbershop",
      "overallRating": 5,
      "comment": "Excellent service!",
      "submittedAt": "2026-01-18T15:30:00Z",
      "incentiveClaimed": true
    }
  ],
  "metadata": {
    "total": 12,
    "page": 1,
    "limit": 20
  }
}
```

---

### 12. Respond to Review

**Endpoint:** `POST /reviews/:reviewId/response`

**Description:** Provider responds to a customer review.

**Authentication:** Required (Provider)

**Request Body:**
```json
{
  "response": "Thank you for the kind words! We appreciate your business."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "reviewId": "507f191e810c19729de860ff",
    "providerResponse": {
      "response": "Thank you for the kind words!",
      "respondedAt": "2026-01-18T16:30:00Z"
    }
  },
  "message": "Response posted successfully"
}
```

**Validation:**
- Provider can only respond to reviews for their own services
- Response max 1000 characters

---

### 13. Mark Review as Helpful

**Endpoint:** `POST /reviews/:reviewId/helpful`

**Description:** Mark a review as helpful (or not helpful).

**Authentication:** Required (any user)

**Request Body:**
```json
{
  "vote": "helpful"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "reviewId": "507f191e810c19729de860ff",
    "helpfulVotes": 24,
    "notHelpfulVotes": 2
  },
  "message": "Vote recorded successfully"
}
```

---

### 14. Decline Review Request

**Endpoint:** `POST /reviews/request/:requestId/decline`

**Description:** Customer declines to submit a review.

**Authentication:** Required (Customer)

**Request Body:**
```json
{
  "reason": "not_interested",
  "feedback": "Too busy right now",
  "permanentlyOptOut": false
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "requestId": "507f191e810c19729de860f1",
    "status": "declined",
    "followUpDisabled": false
  },
  "message": "Your preferences have been updated"
}
```

---

### 15. Request Review Reminder

**Endpoint:** `POST /reviews/request/:requestId/remind`

**Description:** Customer asks to be reminded later to submit a review.

**Authentication:** Required (Customer)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "requestId": "507f191e810c19729de860f1",
    "nextReminderDate": "2026-01-19T09:00:00Z",
    "reminderCount": 1
  },
  "message": "We'll remind you tomorrow morning"
}
```

---

### 16. Update Review Preferences

**Endpoint:** `PUT /customers/review-preferences`

**Description:** Update customer's review request preferences.

**Authentication:** Required (Customer)

**Request Body:**
```json
{
  "reviewRequestsEnabled": true,
  "preferredChannel": "push",
  "preferredTimeOfDay": "morning",
  "maxRequestsPerMonth": 3
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "preferences": {
      "reviewRequestsEnabled": true,
      "preferredChannel": "push",
      "preferredTimeOfDay": "morning",
      "maxRequestsPerMonth": 3
    }
  },
  "message": "Preferences updated successfully"
}
```

---

### 17. Get Pending Review Requests

**Endpoint:** `GET /customers/reviews/pending`

**Description:** Get all pending review requests for the authenticated customer.

**Authentication:** Required (Customer)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "requestId": "507f191e810c19729de860f1",
      "providerName": "John's Barbershop",
      "serviceType": "Men's Haircut",
      "serviceDate": "2026-01-15T14:00:00Z",
      "requestedAt": "2026-01-16T09:00:00Z",
      "expiresAt": "2026-01-23T09:00:00Z",
      "channel": "push"
    }
  ],
  "metadata": {
    "total": 2
  }
}
```

---

## Analytics APIs

### 18. Get Pricing Analytics

**Endpoint:** `GET /analytics/pricing`

**Description:** Get pricing analytics for providers or admins.

**Authentication:** Required (Provider or Admin)

**Query Parameters:**
- `providerId` (string) - For providers viewing their own stats
- `serviceCategoryId` (string) - Filter by category
- `period` (enum: day, week, month, year)
- `startDate` (date)
- `endDate` (date)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-01T00:00:00Z",
      "end": "2026-01-18T23:59:59Z"
    },
    "overview": {
      "totalPricingConfigs": 5,
      "activeConfigs": 5,
      "priceChanges": 2,
      "averagePrice": 520
    },
    "pricingByType": [
      {
        "pricingType": "flat",
        "count": 3,
        "averagePrice": 450
      },
      {
        "pricingType": "hourly",
        "count": 2,
        "averagePrice": 3000
      }
    ],
    "priceComparison": {
      "yourAveragePrice": 520,
      "marketAverage": 500,
      "percentile": "65th"
    },
    "revenueTrends": [
      {
        "date": "2026-01-01",
        "bookings": 15,
        "revenue": 7500
      }
    ]
  }
}
```

---

### 19. Get Review Analytics

**Endpoint:** `GET /analytics/reviews`

**Description:** Get review analytics for providers or admins.

**Authentication:** Required (Provider or Admin)

**Query Parameters:**
- `providerId` (string) - For providers viewing their own stats
- `period` (enum: day, week, month, year)
- `startDate` (date)
- `endDate` (date)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-01T00:00:00Z",
      "end": "2026-01-18T23:59:59Z"
    },
    "overview": {
      "totalReviews": 45,
      "averageRating": 4.7,
      "responseRate": 82
    },
    "ratingDistribution": {
      "5": 35,
      "4": 8,
      "3": 2,
      "2": 0,
      "1": 0
    },
    "trends": [
      {
        "date": "2026-01-01",
        "reviews": 3,
        "averageRating": 4.8
      }
    ],
    "categoryBreakdown": {
      "punctuality": 4.8,
      "quality": 4.7,
      "professionalism": 4.9,
      "communication": 4.5,
      "value": 4.6
    },
    "competitorComparison": {
      "yourRating": 4.7,
      "marketAverage": 4.3,
      "percentile": "85th"
    }
  }
}
```

---

### 20. Get Platform Review Analytics (Admin)

**Endpoint:** `GET /admin/analytics/reviews`

**Description:** Platform-wide review analytics.

**Authentication:** Required (Admin)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-01T00:00:00Z",
      "end": "2026-01-18T23:59:59Z"
    },
    "requests": {
      "sent": 5000,
      "delivered": 4850,
      "failed": 150,
      "deliveryRate": 97
    },
    "responses": {
      "total": 2050,
      "submitted": 1800,
      "declined": 150,
      "expired": 100,
      "responseRate": 41
    },
    "byChannel": [
      {
        "channel": "push",
        "sent": 2000,
        "responses": 900,
        "responseRate": 45,
        "cost": 0
      },
      {
        "channel": "sms",
        "sent": 2000,
        "responses": 750,
        "responseRate": 37.5,
        "cost": 4000
      },
      {
        "channel": "whatsapp",
        "sent": 1000,
        "responses": 400,
        "responseRate": 40,
        "cost": 100
      }
    ],
    "byTiming": [
      {
        "timingStrategy": "2_hours",
        "sent": 1500,
        "responses": 550,
        "responseRate": 36.7
      },
      {
        "timingStrategy": "next_morning",
        "sent": 2000,
        "responses": 900,
        "responseRate": 45
      },
      {
        "timingStrategy": "3_days",
        "sent": 1500,
        "responses": 600,
        "responseRate": 40
      }
    ],
    "ratings": {
      "total": 1800,
      "average": 4.5,
      "distribution": {
        "5": 1200,
        "4": 400,
        "3": 150,
        "2": 40,
        "1": 10
      }
    },
    "incentives": {
      "claimed": 1500,
      "claimRate": 83.3,
      "totalCost": 150000,
      "breakdown": [
        {
          "incentiveType": "discount_100",
          "claimed": 1200,
          "cost": 120000
        },
        {
          "incentiveType": "points_100",
          "claimed": 300,
          "cost": 30000
        }
      ]
    }
  }
}
```

---

## Admin APIs

### 21. Moderate Review

**Endpoint:** `PUT /admin/reviews/:reviewId/moderate`

**Description:** Admin moderates a flagged review.

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "action": "approve",
  "reason": "Review is authentic and follows guidelines"
}
```

**Actions:** `approve`, `reject`, `flag`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "reviewId": "507f191e810c19729de860ff",
    "moderationStatus": "approved",
    "flagged": false,
    "moderatedBy": "507f1f77bcf86cd799439999",
    "moderatedAt": "2026-01-18T17:00:00Z"
  },
  "message": "Review approved successfully"
}
```

---

### 22. Create Review Campaign

**Endpoint:** `POST /admin/campaigns`

**Description:** Create an A/B testing campaign for review requests.

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "Timing Test - 2 hours vs Next Morning",
  "experiment": {
    "type": "timing",
    "description": "Test which timing yields better response rates",
    "hypothesis": "Next morning requests will have 20% higher response rate"
  },
  "variants": [
    {
      "variantId": "timing_a",
      "name": "2 hours after service",
      "config": {
        "delay": 2,
        "unit": "hours"
      },
      "trafficAllocation": 50
    },
    {
      "variantId": "timing_b",
      "name": "Next morning 9 AM",
      "config": {
        "delay": 1,
        "unit": "days",
        "time": "09:00"
      },
      "trafficAllocation": 50
    }
  ],
  "targeting": {
    "serviceCategories": ["507f1f77bcf86cd799439011"],
    "sampleSize": 1000
  },
  "startDate": "2026-01-20T00:00:00Z",
  "endDate": "2026-02-20T00:00:00Z"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_timing_001",
    "status": "draft",
    "createdAt": "2026-01-18T18:00:00Z"
  },
  "message": "Campaign created successfully"
}
```

---

### 23. Get Campaign Results

**Endpoint:** `GET /admin/campaigns/:campaignId/results`

**Description:** Get results of an A/B testing campaign.

**Authentication:** Required (Admin)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_timing_001",
    "name": "Timing Test - 2 hours vs Next Morning",
    "status": "completed",
    "results": {
      "totalParticipants": 1000,
      "variantResults": [
        {
          "variantId": "timing_a",
          "name": "2 hours after service",
          "participants": 500,
          "responses": 175,
          "responseRate": 35,
          "averageRating": 4.6,
          "confidenceInterval": {
            "lower": 31,
            "upper": 39
          }
        },
        {
          "variantId": "timing_b",
          "name": "Next morning 9 AM",
          "participants": 500,
          "responses": 225,
          "responseRate": 45,
          "averageRating": 4.7,
          "confidenceInterval": {
            "lower": 41,
            "upper": 49
          }
        }
      ],
      "winner": {
        "variantId": "timing_b",
        "confidence": 95,
        "improvement": "+28.6% response rate"
      }
    }
  }
}
```

---

## Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "flatRate",
        "message": "flatRate is required for flat pricing type"
      }
    ]
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

### Default Limits

- **Unauthenticated:** 100 requests/hour
- **Authenticated (Customer):** 1000 requests/hour
- **Authenticated (Provider):** 2000 requests/hour
- **Admin:** 10,000 requests/hour

### Rate Limit Headers

Every response includes rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1642502400
```

---

## Pagination

All list endpoints support pagination via query parameters:

- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)

**Response includes:**
```json
{
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

## Versioning

API version is specified in the URL path: `/v1/`

Breaking changes will increment the version number to `/v2/`.

---

## Webhooks (Future)

For real-time notifications, webhooks can be configured:

**Endpoints:**
- `POST /webhooks` - Register webhook
- `GET /webhooks` - List webhooks
- `DELETE /webhooks/:id` - Delete webhook

**Events:**
- `review.created` - New review submitted
- `review.response_added` - Provider responded to review
- `pricing.updated` - Provider updated pricing
- `review.request.delivered` - Review request delivered

---

This completes the API specification for both User-Driven Pricing System and Intelligent Review System.

# DumuWaks 2.0 - Development Standards & Best Practices

## Overview

This document defines coding standards, patterns, and best practices for the DumuWaks 2.0 development team. Following these standards ensures code quality, maintainability, and consistency across the codebase.

---

## Table of Contents

1. [Backend Standards (Node.js)](#backend-standards-nodejs)
2. [Frontend Standards (React)](#frontend-standards-react)
3. [Database Standards (MongoDB)](#database-standards-mongodb)
4. [API Design Standards](#api-design-standards)
5. [Testing Standards](#testing-standards)
6. [Git Workflow](#git-workflow)
7. [Documentation Standards](#documentation-standards)

---

## Backend Standards (Node.js)

### File Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── services/         # Business logic
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── middlewares/      # Express middlewares
│   ├── utils/            # Utility functions
│   ├── validators/       # Request validation schemas
│   ├── jobs/             # Bull queue jobs
│   ├── tests/            # Test files
│   └── app.js            # Express app setup
├── package.json
└── README.md
```

### Code Style (JavaScript/Node.js)

**Use ESLint with Airbnb config:**

```bash
npm install --save-dev eslint eslint-config-airbnb-base
```

**Key Rules:**
- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Maximum line length: 100 characters
- No unused variables
- No console.log in production (use logger)

**Example:**
```javascript
// Good
const calculatePrice = (basePrice, discount) => {
  const finalPrice = basePrice - (basePrice * discount / 100);
  return Math.max(finalPrice, 0); // Ensure non-negative
};

// Bad
const calc = (p, d) => p - p * d / 100; // Unclear naming
```

### Naming Conventions

```javascript
// Variables: camelCase
const providerId = '123';
const isActive = true;

// Constants: UPPER_SNAKE_CASE
const MAX_REVIEW_LENGTH = 2000;
const DEFAULT_PAGE_SIZE = 20;

// Classes/Models: PascalCase
class ServicePricing extends Model {}

// Functions: camelCase with verbs
function createPricing(data) { }
function updatePricing(id, data) { }
function deletePricing(id) { }

// Private functions: prefixed with underscore
function _validatePricingData(data) { }

// Async functions: prefix with try
async function tryCreatePricing(data) {
  try {
    // Implementation
  } catch (error) {
    // Handle error
  }
}
```

### Error Handling

**Use custom error classes:**

```javascript
// utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Usage
throw new AppError('Pricing not found', 404);

// Async error wrapper
// utils/catchAsync.js
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage in routes
router.get('/:id', catchAsync(async (req, res) => {
  const pricing = await Pricing.findById(req.params.id);
  if (!pricing) {
    throw new AppError('Pricing not found', 404);
  }
  res.json(pricing);
}));
```

### Service Layer Pattern

**Separate business logic from controllers:**

```javascript
// services/pricingService.js
class PricingService {
  async createPricing(providerId, pricingData) {
    // Business logic here
    const pricing = await ServicePricing.create({
      providerId,
      ...pricingData
    });

    // Audit trail
    await PricingHistory.create({
      providerId,
      pricingId: pricing._id,
      changeType: 'created',
      newState: pricing.toJSON()
    });

    // Invalidate cache
    await redis.del(`pricing:${providerId}`);

    return pricing;
  }

  async calculatePrice(pricingId, options) {
    const pricing = await ServicePricing.findById(pricingId);

    let totalPrice = pricing.currentPrice;

    // Apply dynamic pricing
    if (pricing.dynamicPricing.enabled) {
      if (options.isRush) {
        totalPrice += totalPrice * pricing.dynamicPricing.rushFee / 100;
      }
      if (options.isWeekend) {
        totalPrice += totalPrice * pricing.dynamicPricing.weekendFee / 100;
      }
    }

    // Apply discount
    if (options.isNewCustomer && pricing.discounts.newCustomerDiscount) {
      totalPrice -= totalPrice * pricing.discounts.newCustomerDiscount / 100;
    }

    return Math.round(totalPrice);
  }
}

module.exports = new PricingService();
```

### Validation

**Use Joi for request validation:**

```javascript
// validators/pricingValidators.js
const Joi = require('joi');

const createPricingSchema = Joi.object({
  serviceCategoryId: Joi.string().required(),
  serviceName: Joi.string().min(3).max(100).required(),
  pricingType: Joi.string().valid('flat', 'hourly', 'tiered', 'package').required(),
  flatRate: Joi.number().when('pricingType', {
    is: 'flat',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  hourlyRate: Joi.number().when('pricingType', {
    is: 'hourly',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  currency: Joi.string().valid('KES', 'USD', 'EUR').default('KES')
});

// Middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.details[0].message
      }
    });
  }
  next();
};

module.exports = { createPricingSchema, validate };
```

### Logging

**Use Winston for structured logging:**

```javascript
// config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Usage
logger.info('Pricing created', {
  providerId: pricing.providerId,
  pricingId: pricing._id,
  pricingType: pricing.pricingType
});

logger.error('Pricing creation failed', {
  error: error.message,
  stack: error.stack,
  providerId: data.providerId
});
```

---

## Frontend Standards (React)

### File Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   │   ├── common/       # Button, Input, etc.
│   │   ├── pricing/      # Pricing-specific components
│   │   └── reviews/      # Review-specific components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API calls
│   ├── context/          # React Context providers
│   ├── utils/            # Utility functions
│   ├── constants/        # Constants
│   └── App.js
├── public/
└── package.json
```

### Component Structure

**Functional components with hooks:**

```javascript
// components/pricing/PricingForm.jsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

const PricingForm = ({ providerId, onSuccess }) => {
  const [selectedTab, setSelectedTab] = useState('flat');

  const { register, handleSubmit, formState: { errors } } = useForm();

  const { mutate: createPricing, isLoading } = useMutation({
    mutationFn: (data) => api.createPricing(providerId, data),
    onSuccess: () => {
      onSuccess?.();
    }
  });

  const onSubmit = (data) => {
    createPricing(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};

export default PricingForm;
```

### Naming Conventions

```javascript
// Components: PascalCase
const PricingForm = () => { };
const ReviewCard = () => { };

// Hooks: camelCase with 'use' prefix
const usePricing = () => { };
const useReviews = () => { };

// Functions: camelCase
const calculatePrice = () => { };
const formatCurrency = () => { };

// Constants: UPPER_SNAKE_CASE
const MAX_PRICE = 50000;
const DEFAULT_CURRENCY = 'KES';
```

### State Management

**React Query for server state:**

```javascript
// hooks/usePricing.js
import { useQuery } from '@tanstack/react-query';

const usePricing = (providerId) => {
  return useQuery({
    queryKey: ['pricing', providerId],
    queryFn: () => api.getPricing(providerId),
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 24 * 60 * 60 * 1000 // 24 hours
  });
};

export default usePricing;
```

**React Context for client state:**

```javascript
// context/PricingContext.js
import React, { createContext, useContext } from 'react';

const PricingContext = createContext();

export const PricingProvider = ({ children }) => {
  const [selectedTier, setSelectedTier] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <PricingContext.Provider value={{
      selectedTier,
      setSelectedTier,
      showPreview,
      setShowPreview
    }}>
      {children}
    </PricingContext.Provider>
  );
};

export const usePricingContext = () => {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error('usePricingContext must be used within PricingProvider');
  }
  return context;
};
```

### Styling

**TailwindCSS utility-first:**

```jsx
// Good: Utility classes
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-bold text-gray-900">Pricing</h2>
</div>

// Avoid: Inline styles (except dynamic values)
<div style={{ marginTop: `${spacing}px` }}>Dynamic spacing</div>

// Avoid: CSS files (use Tailwind instead)
```

---

## Database Standards (MongoDB)

### Schema Definition

**Use Mongoose with validation:**

```javascript
// models/ServicePricing.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const servicePricingSchema = new Schema({
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
    index: true
  },
  serviceName: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    minlength: [3, 'Service name must be at least 3 characters'],
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  pricingType: {
    type: String,
    enum: ['flat', 'hourly', 'tiered', 'package', 'hybrid'],
    required: true
  },
  flatRate: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v) {
        return this.pricingType === 'flat' ? v != null : true;
      },
      message: 'Flat rate is required for flat pricing type'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
servicePricingSchema.index({ providerId: 1, isActive: 1 });
servicePricingSchema.index({ serviceCategoryId: 1, pricingType: 1 });

// Virtuals
servicePricingSchema.virtual('currentPrice').get(function() {
  switch(this.pricingType) {
    case 'flat': return this.flatRate;
    case 'hourly': return this.hourlyRate;
    default: return 0;
  }
});

module.exports = mongoose.model('ServicePricing', servicePricingSchema);
```

### Query Patterns

**Use lean() for read-only queries:**

```javascript
// Good: Faster, returns plain JS objects
const pricing = await ServicePricing
  .find({ providerId })
  .lean()
  .exec();

// Bad: Returns Mongoose documents (slower)
const pricing = await ServicePricing.find({ providerId });
```

**Use select() to limit fields:**

```javascript
const pricing = await ServicePricing
  .findOne({ _id: id })
  .select('serviceName pricingType flatRate')
  .lean();
```

**Use aggregation for complex queries:**

```javascript
const stats = await ServicePricing.aggregate([
  { $match: { serviceCategoryId: categoryId } },
  { $group: {
      _id: null,
      avgPrice: { $avg: '$flatRate' },
      minPrice: { $min: '$flatRate' },
      maxPrice: { $max: '$flatRate' },
      count: { $sum: 1 }
    }
  }
]);
```

---

## API Design Standards

### Response Format

**Standard success response:**

```json
{
  "success": true,
  "data": {
    "pricingId": "507f191e810c19729de860ea",
    "serviceName": "Men's Haircut",
    "flatRate": 500
  },
  "message": "Pricing created successfully",
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Standard error response:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "serviceName",
        "message": "Service name is required"
      }
    ]
  }
}
```

### Status Codes

- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `422 Unprocessable Entity` - Business logic error
- `500 Internal Server Error` - Server error

### Route Naming

```
GET    /providers/:id/pricing          # List all pricing
POST   /providers/pricing              # Create pricing
GET    /providers/pricing/suggestions  # Get suggestions
PUT    /providers/pricing/:id          # Update pricing
DELETE /providers/pricing/:id          # Delete pricing
```

---

## Testing Standards

### Backend Testing

**Unit tests with Jest:**

```javascript
// tests/services/pricingService.test.js
const PricingService = require('../../services/pricingService');

describe('PricingService', () => {
  describe('createPricing', () => {
    it('should create pricing with valid data', async () => {
      const data = {
        serviceName: 'Haircut',
        pricingType: 'flat',
        flatRate: 500
      };

      const pricing = await PricingService.createPricing('provider123', data);

      expect(pricing.serviceName).toBe('Haircut');
      expect(pricing.flatRate).toBe(500);
    });

    it('should throw error with invalid data', async () => {
      await expect(
        PricingService.createPricing('provider123', {})
      ).rejects.toThrow('Validation error');
    });
  });
});
```

**Integration tests with Supertest:**

```javascript
// tests/integration/pricing.test.js
const request = require('supertest');
const app = require('../../app');

describe('POST /providers/pricing', () => {
  it('should create pricing', async () => {
    const response = await request(app)
      .post('/api/v1/providers/pricing')
      .set('Authorization', `Bearer ${token}`)
      .send({
        serviceName: 'Haircut',
        pricingType: 'flat',
        flatRate: 500
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.pricingId).toBeDefined();
  });
});
```

### Frontend Testing

**Component tests with React Testing Library:**

```javascript
// components/__tests__/PricingForm.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import PricingForm from '../PricingForm';

describe('PricingForm', () => {
  it('should render form fields', () => {
    render(<PricingForm providerId="123" />);

    expect(screen.getByLabelText('Service Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Pricing Type')).toBeInTheDocument();
  });

  it('should submit form with valid data', () => {
    const onSuccess = jest.fn();
    render(<PricingForm providerId="123" onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText('Service Name'), {
      target: { value: 'Haircut' }
    });
    fireEvent.click(screen.getByText('Submit'));

    expect(onSuccess).toHaveBeenCalled();
  });
});
```

---

## Git Workflow

### Branch Naming

```
feature/pricing-crud
feature/review-scheduling
fix/pricing-validation
hotfix/review-submission-error
refactor/database-queries
docs/api-documentation
test/pricing-service-tests
```

### Commit Messages

**Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting)
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Build/config changes

**Examples:**

```
feat(pricing): add tiered pricing model

Implement tiered pricing with basic, standard, and premium tiers.
Add validation for tier names and prices.

Closes #123
```

```
fix(reviews): resolve validation error on review submission

Fix issue where review submission fails when photos array is empty.
Add proper validation for optional photo field.

Fixes #456
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally

## Related Issues
Closes #123
```

---

## Documentation Standards

### Code Comments

**When to comment:**
- Complex business logic
- Non-obvious algorithms
- Workarounds for bugs
- Public API documentation

```javascript
// Bad: Obvious comment
// Increment count
count++;

// Good: Explains why
// Use exponential backoff for retries to avoid overwhelming the service
const retryDelay = Math.min(1000 * Math.pow(2, attempt), 30000);
```

### API Documentation

**Use JSDoc for public functions:**

```javascript
/**
 * Calculate the final price for a service with all adjustments
 *
 * @param {Object} pricing - The pricing configuration
 * @param {Object} options - Calculation options
 * @param {boolean} options.isRush - Is this a rush booking?
 * @param {boolean} options.isWeekend - Is this on a weekend?
 * @param {boolean} options.isNewCustomer - Is this a new customer?
 * @returns {number} The final price in KES
 *
 * @example
 * const price = calculatePrice(pricing, { isRush: true, isWeekend: false });
 * // Returns 600 (base 500 + 20% rush fee)
 */
function calculatePrice(pricing, options) {
  // Implementation
}
```

### README Files

**Each major directory should have a README.md:**

```
backend/src/services/README.md
backend/src/models/README.md
frontend/src/components/README.md
```

---

## Performance Guidelines

### Backend

**Database queries:**
- Use indexes on frequently queried fields
- Use lean() for read operations
- Limit fields with select()
- Use pagination (skip/limit)

**Caching:**
- Cache expensive calculations
- Cache frequently accessed data
- Set appropriate TTLs
- Invalidate cache on updates

**API responses:**
- Use compression (gzip)
- Minimize response size
- Use pagination
- Implement rate limiting

### Frontend

**Rendering:**
- Use React.memo for expensive components
- Use useMemo/useCallback for expensive computations
- Implement code splitting
- Lazy load images

**Network:**
- Use React Query caching
- Implement optimistic updates
- Debounce search inputs
- Cancel pending requests on unmount

---

## Security Guidelines

### Backend

**Authentication:**
- Always validate JWT tokens
- Check permissions for protected routes
- Implement rate limiting
- Use HTTPS only in production

**Input Validation:**
- Validate all inputs with Joi
- Sanitize user input
- Parameterize database queries
- Escape output

**Data Protection:**
- Hash passwords with bcrypt
- Never log sensitive data
- Use environment variables for secrets
- Implement CORS correctly

### Frontend

**XSS Prevention:**
- React escapes by default (good!)
- Avoid dangerouslySetInnerHTML
- Sanitize HTML if needed (DOMPurify)

**Data Storage:**
- Don't store tokens in localStorage (use httpOnly cookies)
- Clear sensitive data on logout
- Validate data from API

---

## Conclusion

Following these standards ensures:
- Consistent code across the team
- Easier onboarding for new developers
- Better code maintainability
- Fewer bugs
- Better performance
- Improved security

**Questions?** Ask the tech lead or refer to this document.

**Happy Coding! 🚀**

# EmenTech Authentication System Documentation

**Last Updated:** January 21, 2026
**System Version:** 1.0.0
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Architecture](#authentication-architecture)
3. [User Model](#user-model)
4. [Authentication Flows](#authentication-flows)
5. [API Endpoints](#api-endpoints)
6. [Security Implementation](#security-implementation)
7. [Session Management](#session-management)
8. [Role-Based Access Control](#role-based-access-control)
9. [Error Handling](#error-handling)
10. [Usage Examples](#usage-examples)

---

## Overview

The EmenTech authentication system is a JWT-based authentication solution that provides secure user authentication and authorization for the EmenTech platform. It supports user registration, login, password management, and role-based access control.

### Key Features

- **JWT Token Authentication**: Stateless authentication using JSON Web Tokens
- **Bcrypt Password Hashing**: Secure password storage with salt rounds
- **Role-Based Access Control**: Support for admin, manager, and employee roles
- **Department-Based Organization**: Users organized by departments
- **Account Activation/Deactivation**: Support for active/inactive user states
- **Token Expiration**: Configurable token lifetime (default: 7 days)

---

## Authentication Architecture

### Technology Stack

- **Backend Framework**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs (salt rounds: 10)
- **Database**: MongoDB with Mongoose ODM
- **Token Library**: jsonwebtoken

### Authentication Flow Diagram

```
┌─────────┐                 ┌─────────────┐                 ┌──────────┐
│  Client │                 │   Backend   │                 │ Database │
└────┬────┘                 └──────┬──────┘                ────┬───────┘
     │                             │                            │
     │ 1. POST /api/auth/register  │                            │
     │────────────────────────────>│                            │
     │                             │ 2. Hash password            │
     │                             │─────────────────────────>   │
     │                             │ 3. Create user              │
     │                             │<─────────────────────────   │
     │                             │ 4. Generate JWT token       │
     │ 5. Return token + user      │                            │
     │<────────────────────────────│                            │
     │                             │                            │
     │ 6. Store token              │                            │
     │                             │                            │
     │                             │                            │
     │ 7. POST /api/auth/login     │                            │
     │────────────────────────────>│                            │
     │                             │ 8. Find user + password     │
     │                             │─────────────────────────>   │
     │                             │ 9. Return user              │
     │                             │<─────────────────────────   │
     │                             │ 10. Verify password         │
     │                             │ 11. Generate JWT token      │
     │ 12. Return token + user     │                            │
     │<────────────────────────────│                            │
     │                             │                            │
     │ 13. GET /api/protected      │                            │
     │ Authorization: Bearer <token>                            │
     │────────────────────────────>│                            │
     │                             │ 14. Verify JWT              │
     │                             │ 15. Extract user ID         │
     │                             │ 16. Fetch user from DB      │
     │                             │─────────────────────────>   │
     │                             │ 17. Return user             │
     │                             │<─────────────────────────   │
     │ 18. Return protected data   │                            │
     │<────────────────────────────│                            │
```

---

## User Model

### User Schema

Location: `/backend/src/models/User.js`

```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (required, hashed, select: false),
  role: String (enum: ['admin', 'manager', 'employee'], default: 'employee'),
  department: String (enum: ['leadership', 'engineering', 'marketing', 'sales', 'support', 'hr'], default: 'engineering'),
  isActive: Boolean (default: true),
  createdAt: Date (default: Date.now)
}
```

### Password Security

- **Hashing Algorithm**: bcrypt
- **Salt Rounds**: 10
- **Storage**: Passwords are hashed before saving to database
- **Selection**: Password field is excluded from queries by default (`select: false`)

### User Roles

1. **admin**: Full system access, can manage all resources
2. **manager**: Can manage team resources and view reports
3. **employee**: Standard user access

### Departments

- leadership
- engineering
- marketing
- sales
- support
- hr

---

## Authentication Flows

### 1. User Registration Flow

**Endpoint**: `POST /api/auth/register`

**Process**:

1. Client sends user registration data (name, email, password, optional role/department)
2. Backend checks if user already exists
3. Password is hashed using bcrypt (10 salt rounds)
4. User is created in database
5. JWT token is generated with user ID
6. Token and user data (without password) are returned to client

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@ementech.co.ke",
  "password": "SecurePass123!",
  "role": "employee",
  "department": "engineering"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@ementech.co.ke",
    "role": "employee",
    "department": "engineering"
  }
}
```

---

### 2. User Login Flow

**Endpoint**: `POST /api/auth/login`

**Process**:

1. Client sends email and password
2. Backend validates input
3. User is fetched from database with password field
4. Password is compared using bcrypt
5. Account active status is verified
6. JWT token is generated
7. Token and user data are returned

**Request Body**:
```json
{
  "email": "john@ementech.co.ke",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@ementech.co.ke",
    "role": "employee",
    "department": "engineering"
  }
}
```

**Error Responses**:

- 400 Bad Request: Missing email or password
- 401 Unauthorized: Invalid credentials or inactive account
- 500 Internal Server Error: Server error

---

### 3. Get Current User Flow

**Endpoint**: `GET /api/auth/me`

**Authentication**: Required (Bearer token)

**Process**:

1. Client sends request with JWT token in Authorization header
2. Token is verified and user ID is extracted
3. User is fetched from database
4. User data (without password) is returned

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@ementech.co.ke",
    "role": "employee",
    "department": "engineering"
  }
}
```

---

### 4. Change Password Flow

**Endpoint**: `PUT /api/auth/password`

**Authentication**: Required (Bearer token)

**Process**:

1. Client sends current password and new password
2. User is fetched with password field
3. Current password is verified
4. New password is validated (minimum 6 characters)
5. Password is hashed and updated in database
6. Success response is returned

**Request Body**:
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses**:

- 400 Bad Request: Missing passwords or new password too short
- 401 Unauthorized: Current password is incorrect
- 500 Internal Server Error: Server error

---

## API Endpoints

### Authentication Routes

Base Path: `/api/auth`

| Method | Endpoint | Authentication | Description |
|--------|----------|----------------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Login user |
| GET | `/me` | Yes | Get current user |
| PUT | `/password` | Yes | Change password |

---

## Security Implementation

### JWT Token Generation

**Function**: `generateToken(userId)`

**Configuration**:
```javascript
{
  secret: process.env.JWT_SECRET,  // From environment variable
  expiresIn: process.env.JWT_EXPIRE || '7d'  // Default 7 days
}
```

**Token Payload**:
```javascript
{
  id: "507f1f77bcf86cd799439011"  // User ID
}
```

### Password Hashing

**Algorithm**: bcrypt
**Salt Rounds**: 10

**Pre-save Hook**:
```javascript
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
```

### Password Verification

**Method**: `user.matchPassword(enteredPassword)`

```javascript
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

---

## Session Management

### JWT Token Usage

**Client-Side Storage**:
- Store token in localStorage or sessionStorage
- Include token in Authorization header for protected requests

**Token Format**:
```
Authorization: Bearer <token>
```

### Token Lifecycle

1. **Creation**: Token created on registration/login
2. **Expiration**: Token expires after configured duration (default: 7 days)
3. **Renewal**: Client must re-login to get new token
4. **Revocation**: Currently, tokens cannot be revoked before expiration (future enhancement)

### Middleware Authentication

**Protected Route Middleware**: `protect`

Location: `/backend/src/middleware/auth.js`

**Process**:
1. Extract token from Authorization header
2. Verify token using JWT secret
3. Extract user ID from token
4. Fetch user from database
5. Verify user is active
6. Attach user to request object
7. Proceed to next middleware/route handler

**Usage**:
```javascript
import { protect } from '../middleware/auth.js';

router.get('/protected', protect, getProtectedData);
```

---

## Role-Based Access Control

### Authorization Middleware

**Function**: `authorize(...roles)`

**Process**:
1. Check if user role is in allowed roles list
2. If yes, proceed to next middleware
3. If no, return 403 Forbidden

**Usage**:
```javascript
import { protect, authorize } from '../middleware/auth.js';

// Only admins can access
router.post('/users', protect, authorize('admin'), createUser);

// Admins and managers can access
router.get('/reports', protect, authorize('admin', 'manager'), getReports);
```

### Role Hierarchy

1. **admin** - Full access to all resources
2. **manager** - Access to management features and reports
3. **employee** - Standard user access

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Please provide email and password"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route. Please login."
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "User role 'employee' is not authorized to access this route"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "User not found with this token"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "stack": "Error stack trace (development only)"
}
```

---

## Usage Examples

### Example 1: Register a New User

```bash
curl -X POST https://ementech.co.ke/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@ementech.co.ke",
    "password": "SecurePass123!",
    "role": "employee",
    "department": "engineering"
  }'
```

### Example 2: Login

```bash
curl -X POST https://ementech.co.ke/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@ementech.co.ke",
    "password": "SecurePass123!"
  }'
```

### Example 3: Access Protected Route

```bash
curl -X GET https://ementech.co.ke/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 4: Change Password

```bash
curl -X PUT https://ementech.co.ke/api/auth/password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!"
  }'
```

---

## Environment Variables

Required environment variables for authentication:

```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Server Configuration
NODE_ENV=production
PORT=5001

# CORS Configuration
CORS_ORIGIN=https://ementech.co.ke
```

---

## Best Practices

### Security Recommendations

1. **JWT Secret**: Use a strong, random secret key (minimum 32 characters)
2. **Password Requirements**: Enforce strong password policies (min 8 characters, mixed case, numbers, symbols)
3. **Token Storage**: Store tokens securely on client-side (httpOnly cookies recommended)
4. **HTTPS**: Always use HTTPS in production
5. **Token Expiration**: Use appropriate expiration times (7 days default)
6. **Rate Limiting**: Implement rate limiting on authentication endpoints
7. **Account Lockout**: Implement account lockout after failed login attempts (future enhancement)

### Development vs Production

**Development**:
- Detailed error messages with stack traces
- CORS allows local development server
- Longer token expiration for testing

**Production**:
- Generic error messages (no stack traces)
- CORS restricted to production domain
- Shorter token expiration recommended
- Strong JWT secret required

---

## Testing Authentication

### Manual Testing Steps

1. **Register User**:
   ```bash
   POST /api/auth/register
   ```

2. **Login**:
   ```bash
   POST /api/auth/login
   ```
   Save the returned token.

3. **Access Protected Route**:
   ```bash
   GET /api/auth/me
   Header: Authorization: Bearer <token>
   ```

4. **Test Token Expiration**:
   - Wait for token to expire
   - Attempt to access protected route
   - Should receive 401 Unauthorized

5. **Test Invalid Token**:
   ```bash
   GET /api/auth/me
   Header: Authorization: Bearer invalid_token
   ```
   Should receive 401 Unauthorized.

---

## Troubleshooting

### Common Issues

**Issue**: "Not authorized to access this route"
- **Cause**: Missing or invalid token
- **Solution**: Ensure token is included in Authorization header

**Issue**: "User not found with this token"
- **Cause**: User deleted or token from old user
- **Solution**: Re-login to get new token

**Issue**: "Your account has been deactivated"
- **Cause**: User account marked as inactive
- **Solution**: Contact administrator to reactivate account

**Issue**: "Invalid credentials"
- **Cause**: Incorrect email or password
- **Solution**: Verify credentials and try again

---

## Files Reference

**Authentication Files**:

- **User Model**: `/backend/src/models/User.js`
- **Auth Controller**: `/backend/src/controllers/authController.js`
- **Auth Routes**: `/backend/src/routes/auth.routes.js`
- **Auth Middleware**: `/backend/src/middleware/auth.js`
- **Server Configuration**: `/backend/src/server.js`

---

## Future Enhancements

1. **Token Refresh**: Implement refresh token mechanism
2. **Password Reset**: Implement forgot password flow
3. **Email Verification**: Require email verification on registration
4. **Two-Factor Authentication**: Add 2FA support
5. **Account Lockout**: Lock accounts after failed login attempts
6. **Session Management**: Add token revocation/blacklisting
7. **OAuth Integration**: Support Google, GitHub OAuth login
8. **Multi-Factor Authentication**: SMS/Email verification codes

---

**Document Version**: 1.0
**Last Updated**: January 21, 2026
**Maintained By**: EmenTech Development Team

# Security Summary

This document outlines the security considerations and recommendations for the Monthly Budget Application.

## Security Measures Implemented

### 1. Authentication & Authorization
- **JWT-based Authentication**: Secure token-based authentication system
- **Password Hashing**: All passwords are hashed using bcrypt before storage
- **Role-Based Access Control (RBAC)**: Comprehensive permission system based on user roles
  - Owner: Full access to all features
  - Admin: Can manage roles, rename house, manage budgets
  - Financier: Can create budgets and record payments
  - Rent Payer: Can record rent payments
  - Member: Read-only access to house information

### 2. Input Validation
- **File Upload Validation**: 
  - File type restrictions (JPEG, PNG, PDF only)
  - File size limit (5MB maximum)
  - Proper file naming with unique identifiers
- **JSON Input Validation**:
  - Type checking before JSON.parse operations
  - Array validation for contributions data
  - Error handling for malformed input
- **Request Validation**:
  - Required field validation on all endpoints
  - Data type validation
  - Boundary checks (e.g., month 1-12, positive amounts)

### 3. Data Security
- **Member Verification**: All endpoints verify user membership before allowing access
- **Role Verification**: Protected operations check user roles before execution
- **Division by Zero Protection**: Guard clauses prevent crashes from edge cases
- **Null/Undefined Handling**: Proper checks for optional or potentially null data

### 4. File System Security
- **Directory Creation**: Automatic creation of upload directories to prevent runtime errors
- **Path Security**: Using path.join to prevent path traversal attacks
- **Static File Serving**: Properly configured static file middleware with restricted access

## Known Security Considerations

### Rate Limiting (Not Implemented)
**Issue**: The application currently does not implement rate limiting on API endpoints.

**Impact**: Without rate limiting, the application is vulnerable to:
- Brute force attacks on login endpoints
- Denial of Service (DoS) attacks
- API abuse

**Recommendation**: Implement rate limiting using a package like `express-rate-limit`:

```javascript
const rateLimit = require('express-rate-limit');

// Apply to authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Apply to other routes with more generous limits
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
});

app.use('/api/', apiLimiter);
```

### Environment Configuration
**Current State**: The application uses a `.env` file for configuration (properly excluded from git).

**Recommendation**: 
- Ensure `.env` file is never committed to version control (already in .gitignore)
- Use strong, randomly generated JWT secrets in production
- Consider using a secrets management service for production deployments

### HTTPS/TLS
**Current State**: The application runs on HTTP in development.

**Recommendation**: 
- Use HTTPS in production environments
- Implement TLS/SSL certificates
- Consider using a reverse proxy (nginx, Apache) or cloud load balancer with SSL termination

### File Upload Security
**Current Implementation**: Basic validation of file types and sizes.

**Additional Recommendations**:
- Scan uploaded files for malware using a service like ClamAV
- Store uploads in a separate storage service (e.g., AWS S3, Google Cloud Storage)
- Implement file download quotas to prevent abuse
- Add MIME type verification beyond extension checking

### Database Security
**Current State**: MongoDB connection with basic configuration.

**Recommendations**:
- Enable MongoDB authentication in production
- Use connection encryption
- Implement database backups
- Consider using MongoDB Atlas for managed security
- Implement database query optimization to prevent NoSQL injection

### CORS Configuration
**Current State**: CORS is enabled for all origins in development.

**Recommendation**: 
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

## Security Best Practices for Deployment

1. **Environment Variables**: Never hardcode secrets, use environment variables
2. **Dependencies**: Regularly update npm packages to patch security vulnerabilities
3. **Monitoring**: Implement logging and monitoring for suspicious activities
4. **Input Sanitization**: Consider using libraries like `validator.js` for additional validation
5. **Session Management**: Implement proper token expiration and refresh mechanisms
6. **Error Handling**: Don't expose stack traces or sensitive information in error messages
7. **Security Headers**: Use helmet.js to set secure HTTP headers

## Vulnerability Scanning

### npm audit
Run `npm audit` regularly to check for known vulnerabilities in dependencies.

```bash
npm audit
npm audit fix
```

### CodeQL Analysis
The application has been scanned with CodeQL. The primary finding was the lack of rate limiting, which should be addressed before production deployment.

## Security Contact

For security issues or concerns, please follow responsible disclosure practices and contact the repository maintainers.

## Last Updated

This security summary was last updated on: 2025-12-13

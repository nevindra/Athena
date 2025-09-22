# Authentication System

## Overview
The Authentication system provides secure user registration, login, session management, and access control for the Athena application using modern security practices and Better Auth framework.

## Features

### User Authentication
- **Email/Password Registration**: Secure account creation with email verification
- **Login/Logout**: Session-based authentication with secure token management
- **Password Security**: Bcrypt hashing with salt rounds and complexity requirements
- **Session Management**: JWT-based sessions with refresh token rotation
- **Remember Me**: Extended session duration for trusted devices

### Security Features
- **Rate Limiting**: Protection against brute force attacks
- **CSRF Protection**: Cross-site request forgery prevention
- **Session Security**: Secure cookie configuration with HttpOnly and SameSite
- **Password Reset**: Secure password reset flow with time-limited tokens
- **Account Verification**: Email verification for new registrations

### User Management
- **Profile Management**: User profile updates and preferences
- **Account Settings**: Security settings and session management
- **Multi-device Support**: Manage sessions across multiple devices
- **Account Deletion**: Secure account termination with data cleanup

## Backend Architecture

### API Endpoints
```
POST /api/auth/register              # User registration
POST /api/auth/login                 # User login
POST /api/auth/logout                # User logout
POST /api/auth/refresh               # Refresh access token

GET /api/auth/me                     # Get current user info
PUT /api/auth/profile                # Update user profile
POST /api/auth/change-password       # Change password
POST /api/auth/forgot-password       # Request password reset
POST /api/auth/reset-password        # Reset password with token

GET /api/auth/sessions               # List active sessions
DELETE /api/auth/sessions/:id        # Revoke specific session
POST /api/auth/verify-email          # Verify email address
POST /api/auth/resend-verification   # Resend verification email
```

### Database Schema
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255),
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW()
);

-- Login Attempts table (for rate limiting)
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255),
  ip_address INET,
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMP DEFAULT NOW(),
  user_agent TEXT
);

-- User Preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  theme VARCHAR(20) DEFAULT 'system',
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  notifications JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Authentication Service
```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  deviceInfo?: {
    platform: string;
    browser: string;
    os: string;
  };
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  lastUsedAt: Date;
}

class AuthenticationService {
  async register(data: RegisterRequest): Promise<AuthResult>
  async login(email: string, password: string, deviceInfo?: DeviceInfo): Promise<AuthResult>
  async logout(sessionId: string): Promise<void>
  async refreshToken(refreshToken: string): Promise<AuthResult>
  async getCurrentUser(sessionToken: string): Promise<User | null>
  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<User>
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>
  async forgotPassword(email: string): Promise<void>
  async resetPassword(token: string, newPassword: string): Promise<void>
  async verifyEmail(token: string): Promise<void>
  async resendVerification(email: string): Promise<void>
}
```

### Password Security
```typescript
class PasswordService {
  private readonly saltRounds = 12;
  private readonly minLength = 8;
  private readonly requirements = {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false
  };

  async hashPassword(password: string): Promise<string> {
    this.validatePassword(password);
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  validatePassword(password: string): void {
    if (password.length < this.minLength) {
      throw new Error(`Password must be at least ${this.minLength} characters`);
    }

    if (this.requirements.uppercase && !/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (this.requirements.lowercase && !/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (this.requirements.numbers && !/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (this.requirements.symbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one symbol');
    }
  }
}
```

### Session Management
```typescript
class SessionService {
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';
  private readonly maxSessions = 10;

  async createSession(userId: string, deviceInfo?: DeviceInfo): Promise<SessionTokens> {
    // Clean up old sessions if at max limit
    await this.cleanupOldSessions(userId);

    const session = await this.db.sessions.create({
      userId,
      tokenHash: await this.hashToken(accessToken),
      refreshTokenHash: await this.hashToken(refreshToken),
      deviceInfo,
      ipAddress: this.getCurrentIP(),
      userAgent: this.getCurrentUserAgent(),
      expiresAt: new Date(Date.now() + ms(this.accessTokenExpiry))
    });

    return {
      accessToken: this.signJWT({ sessionId: session.id, userId }, this.accessTokenExpiry),
      refreshToken: this.signJWT({ sessionId: session.id }, this.refreshTokenExpiry)
    };
  }

  async validateSession(token: string): Promise<Session | null> {
    try {
      const payload = this.verifyJWT(token);
      const session = await this.db.sessions.findById(payload.sessionId);

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      // Update last used timestamp
      await this.db.sessions.update(session.id, { lastUsedAt: new Date() });
      return session;
    } catch (error) {
      return null;
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.db.sessions.delete(sessionId);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.db.sessions.deleteMany({ userId });
  }
}
```

## Frontend Architecture

### Core Components

#### Authentication Forms (`/features/auth/`)
- **LoginForm**: Email/password login with validation
- **RegisterForm**: User registration with email verification
- **ForgotPasswordForm**: Password reset request form
- **ResetPasswordForm**: New password entry with token validation
- **VerifyEmailForm**: Email verification interface

#### User Management
- **ProfileSettings**: User profile editing interface
- **SecuritySettings**: Password change and security options
- **SessionManager**: Active session management and device list
- **PreferencesPanel**: User preferences and settings

#### Authentication Guards
- **ProtectedRoute**: Route protection for authenticated users
- **AuthProvider**: Authentication context provider
- **LoginRequired**: Component-level authentication checking

### State Management
```typescript
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionInfo: SessionInfo | null;
}

interface SessionInfo {
  id: string;
  expiresAt: Date;
  deviceInfo: DeviceInfo;
  lastUsedAt: Date;
}
```

### Hooks
```typescript
// Authentication hooks
useCurrentUser()
useLogin()
useRegister()
useLogout()
useRefreshToken()

// User management hooks
useUpdateProfile()
useChangePassword()
useForgotPassword()
useResetPassword()

// Session management hooks
useActiveSessions()
useRevokeSession()
useSessionInfo()

// Authentication guards
useRequireAuth()
useOptionalAuth()
```

## Better Auth Integration

### Configuration
```typescript
// auth.config.ts
export const authConfig = {
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24 // 1 day
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    maxAge: 60 * 15 // 15 minutes
  },
  cookies: {
    sessionToken: {
      name: 'athena-session',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  pages: {
    signIn: '/login',
    signUp: '/signup',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request'
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.userId = token.userId;
      return session;
    }
  }
};
```

### Authentication Client
```typescript
// auth-client.ts
import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5 // 5 minutes
    }
  }
});

// Authentication methods
export const {
  signIn,
  signUp,
  signOut,
  getSession,
  useSession
} = authClient;
```

## Security Implementation

### Rate Limiting
```typescript
class RateLimiter {
  private readonly limits = {
    login: { max: 5, window: '15m' },
    register: { max: 3, window: '1h' },
    passwordReset: { max: 3, window: '1h' },
    emailVerification: { max: 5, window: '1h' }
  };

  async checkLimit(key: string, identifier: string): Promise<boolean> {
    const limit = this.limits[key];
    const attempts = await this.redis.get(`rate_limit:${key}:${identifier}`);

    if (attempts && parseInt(attempts) >= limit.max) {
      throw new Error(`Too many ${key} attempts. Try again later.`);
    }

    await this.redis.incr(`rate_limit:${key}:${identifier}`);
    await this.redis.expire(`rate_limit:${key}:${identifier}`, ms(limit.window) / 1000);

    return true;
  }
}
```

### CSRF Protection
```typescript
// CSRF middleware
export function csrfProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const token = req.headers['x-csrf-token'] || req.body._csrf;
      const sessionToken = req.headers.authorization?.split(' ')[1];

      if (!token || !this.validateCSRFToken(token, sessionToken)) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }
    }
    next();
  };
}
```

### Input Validation
```typescript
// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/\d/, 'Password must contain a number'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});
```

## Email Integration

### Email Service
```typescript
class EmailService {
  async sendVerificationEmail(user: User, token: string): Promise<void> {
    const verificationUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;

    await this.sendEmail({
      to: user.email,
      subject: 'Verify your Athena account',
      template: 'email-verification',
      data: {
        name: user.name,
        verificationUrl,
        expiresIn: '24 hours'
      }
    });
  }

  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${token}`;

    await this.sendEmail({
      to: user.email,
      subject: 'Reset your Athena password',
      template: 'password-reset',
      data: {
        name: user.name,
        resetUrl,
        expiresIn: '1 hour'
      }
    });
  }

  async sendLoginNotification(user: User, deviceInfo: DeviceInfo): Promise<void> {
    await this.sendEmail({
      to: user.email,
      subject: 'New login to your Athena account',
      template: 'login-notification',
      data: {
        name: user.name,
        deviceInfo,
        loginTime: new Date(),
        ipAddress: deviceInfo.ipAddress
      }
    });
  }
}
```

## Error Handling

### Authentication Errors
```typescript
enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_NOT_VERIFIED = 'ACCOUNT_NOT_VERIFIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS'
}

class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
```

## Performance & Optimization

### Session Caching
- **Redis Cache**: Cache active sessions for fast lookup
- **JWT Optimization**: Minimize JWT payload size
- **Session Cleanup**: Regular cleanup of expired sessions
- **Connection Pooling**: Efficient database connection management

### Database Optimization
- **Indexes**: Proper indexing on email, session tokens, and user IDs
- **Query Optimization**: Efficient queries for authentication checks
- **Pagination**: Paginate session lists and user management interfaces

## Monitoring & Analytics

### Authentication Metrics
```typescript
interface AuthMetrics {
  dailyLogins: number;
  newRegistrations: number;
  failedLoginAttempts: number;
  activeUsers: number;
  sessionDuration: number;
  passwordResets: number;
  emailVerifications: number;
}

class AuthAnalytics {
  async trackLogin(userId: string, success: boolean, deviceInfo?: DeviceInfo): Promise<void>
  async trackRegistration(userId: string): Promise<void>
  async trackPasswordReset(email: string): Promise<void>
  async getAuthMetrics(period: TimePeriod): Promise<AuthMetrics>
}
```

## Development Guidelines

### Security Best Practices
- Always hash passwords with bcrypt and sufficient salt rounds
- Use secure random tokens for reset and verification
- Implement proper session management with expiration
- Validate all inputs on both client and server
- Use HTTPS in production
- Implement CSRF protection for state-changing operations

### Testing Strategy
- Unit test all authentication service methods
- Integration test complete authentication flows
- Test security measures (rate limiting, CSRF, etc.)
- E2E test user registration and login workflows
- Security testing for common vulnerabilities

### Deployment Considerations
- Secure JWT secret management
- Proper CORS configuration
- Session storage in production (Redis)
- Email service configuration
- SSL/TLS certificate setup
import jwt from 'jsonwebtoken';
import { User } from '../entities/user';
import { UserRepository } from '../repositories/user-repository';
import { SessionRepository } from '../repositories/session-repository';
import { PasswordService } from './password-service';
// import { EncryptionService } from '@/shared/utils/encryption/encryption-service'; // Currently unused
import { RegisterRequest, LoginRequest } from '@/shared/utils/validation/auth-schemas';

export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthResult {
  user: SafeUser;
  token: string;
  expires_at: Date;
}

export interface SafeUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthenticationService {
  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository,
    // private _encryptionService?: EncryptionService // Currently unused
  ) {}

  async register(registerData: RegisterRequest): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(registerData.email);
    if (existingUser) {
      throw new AuthError('User already exists', 'USER_EXISTS');
    }

    // Hash password
    const passwordHash = await PasswordService.hashPassword(registerData.password);

    // Create user
    const user = await this.userRepository.create({
      email: registerData.email,
      password_hash: passwordHash,
      first_name: registerData.firstName,
      last_name: registerData.lastName,
      role: 'user'
    });

    // Generate JWT token
    const token = this.generateJWTToken(user);
    
    // Create session
    const session = await this.sessionRepository.create({
      user_id: user.id,
      token: token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    return {
      user: this.sanitizeUser(user),
      token: token,
      expires_at: session.expires_at
    };
  }

  async login(loginData: LoginRequest): Promise<AuthResult> {
    // Find user
    const user = await this.userRepository.findByEmail(loginData.email);
    if (!user) {
      throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await PasswordService.verifyPassword(loginData.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Generate new JWT token
    const token = this.generateJWTToken(user);
    
    // Create new session (invalidate old ones)
    await this.sessionRepository.invalidateUserSessions(user.id);
    const session = await this.sessionRepository.create({
      user_id: user.id,
      token: token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    return {
      user: this.sanitizeUser(user),
      token: token,
      expires_at: session.expires_at
    };
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      // Verify JWT
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      
      // Check session
      const session = await this.sessionRepository.findByToken(token);
      if (!session || session.expires_at < new Date()) {
        return null;
      }

      // Get user
      const user = await this.userRepository.findById(payload.userId);
      return user;
    } catch (error) {
      return null;
    }
  }

  async logout(token: string): Promise<void> {
    // Find and delete session
    const session = await this.sessionRepository.findByToken(token);
    if (session) {
      await this.sessionRepository.delete(session.id);
    }
  }

  async refreshToken(token: string): Promise<AuthResult | null> {
    const user = await this.verifyToken(token);
    if (!user) {
      return null;
    }

    // Generate new token
    const newToken = this.generateJWTToken(user);
    
    // Update session
    const session = await this.sessionRepository.findByToken(token);
    if (session) {
      await this.sessionRepository.delete(session.id);
    }

    const newSession = await this.sessionRepository.create({
      user_id: user.id,
      token: newToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    return {
      user: this.sanitizeUser(user),
      token: newToken,
      expires_at: newSession.expires_at
    };
  }

  private generateJWTToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, { 
      expiresIn: '24h',
      issuer: 'email-makers',
      audience: 'email-makers-users'
    });
  }

  private sanitizeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
} 
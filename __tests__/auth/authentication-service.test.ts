import { AuthenticationService, AuthError } from '@/domains/auth/services/authentication-service';
import { PasswordService } from '@/domains/auth/services/password-service';

// Mock repositories
class MockUserRepository {
  users: any[] = [];

  async create(userData: any) {
    const user = {
      id: 'test-user-id',
      email: userData.email,
      password_hash: userData.password_hash,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.push(user);
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.password_hash,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  async findByEmail(email: string) {
    const user = this.users.find(u => u.email === email);
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.password_hash,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  async findById(id: string) {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.password_hash,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}

class MockSessionRepository {
  sessions: any[] = [];

  async create(sessionData: any) {
    const session = {
      id: 'test-session-id',
      user_id: sessionData.user_id,
      token: sessionData.token,
      expires_at: sessionData.expires_at,
      created_at: new Date(),
    };
    this.sessions.push(session);
    return session;
  }

  async findByToken(token: string) {
    return this.sessions.find(s => s.token === token) || null;
  }

  async invalidateUserSessions(userId: string) {
    this.sessions = this.sessions.filter(s => s.user_id !== userId);
  }
}

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let mockUserRepo: MockUserRepository;
  let mockSessionRepo: MockSessionRepository;

  beforeEach(() => {
    mockUserRepo = new MockUserRepository();
    mockSessionRepo = new MockSessionRepository();
    authService = new AuthenticationService(mockUserRepo as any, mockSessionRepo as any);
    
    // Mock environment variable
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens-12345';
  });

  describe('register', () => {
    it('should create a new user with valid data', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await authService.register(registerData);

      expect(result.user.email).toBe(registerData.email);
      expect(result.user.firstName).toBe(registerData.firstName);
      expect(result.user.lastName).toBe(registerData.lastName);
      expect(result.token).toBeDefined();
      expect(mockUserRepo.users).toHaveLength(1);
    });

    it('should throw error for duplicate email', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      await authService.register(registerData);
      
      await expect(authService.register(registerData))
        .rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // First register a user
      const registerData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };
      await authService.register(registerData);

      // Then login
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      const result = await authService.login(loginData);

      expect(result.user.email).toBe(loginData.email);
      expect(result.token).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'WrongPassword123!'
      };

      await expect(authService.login(loginData))
        .rejects.toThrow('Invalid credentials');
    });
  });
}); 
import crypto from 'crypto';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  algorithm: string;
}

export interface APIKeyData {
  service: string;
  keyName: string;
  encryptedKey: EncryptedData;
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export class APIKeyEncryptionService {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;
  private static readonly ivLength = 16;
  private static readonly tagLength = 16;
  private static readonly saltLength = 16;

  /**
   * Get encryption key from environment secret
   */
  private static getEncryptionKey(): Buffer {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
      throw new Error('ENCRYPTION_SECRET environment variable is required');
    }

    if (secret.length < 32) {
      throw new Error('ENCRYPTION_SECRET must be at least 32 characters long');
    }

    // Use PBKDF2 to derive a key from the secret
    const salt = Buffer.from('emailmakers-salt', 'utf8'); // Fixed salt for consistency
    return crypto.pbkdf2Sync(secret, salt, 100000, this.keyLength, 'sha256');
  }

  /**
   * Encrypt an API key
   */
  static encrypt(apiKey: string, additionalData?: string): EncryptedData {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key cannot be empty');
    }

    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, key);
      
      cipher.setAAD(Buffer.from(additionalData || 'apikey', 'utf8'));
      
      let encrypted = cipher.update(apiKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: this.algorithm,
      };
    } catch (error) {
      throw new Error(`Failed to encrypt API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decrypt an API key
   */
  static decrypt(encryptedData: EncryptedData, additionalData?: string): string {
    if (!encryptedData || !encryptedData.encrypted) {
      throw new Error('Invalid encrypted data');
    }

    try {
      const key = this.getEncryptionKey();
      const decipher = crypto.createDecipher(this.algorithm, key);
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      decipher.setAAD(Buffer.from(additionalData || 'apikey', 'utf8'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Failed to decrypt API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Encrypt multiple API keys for a service
   */
  static encryptServiceKeys(keys: Record<string, string>, serviceName: string): Record<string, EncryptedData> {
    const encryptedKeys: Record<string, EncryptedData> = {};
    
    Object.entries(keys).forEach(([keyName, keyValue]) => {
      const additionalData = `${serviceName}:${keyName}`;
      encryptedKeys[keyName] = this.encrypt(keyValue, additionalData);
    });
    
    return encryptedKeys;
  }

  /**
   * Decrypt multiple API keys for a service
   */
  static decryptServiceKeys(encryptedKeys: Record<string, EncryptedData>, serviceName: string): Record<string, string> {
    const decryptedKeys: Record<string, string> = {};
    
    Object.entries(encryptedKeys).forEach(([keyName, encryptedData]) => {
      const additionalData = `${serviceName}:${keyName}`;
      decryptedKeys[keyName] = this.decrypt(encryptedData, additionalData);
    });
    
    return decryptedKeys;
  }

  /**
   * Create a secure API key storage object
   */
  static createAPIKeyData(
    service: string,
    keyName: string,
    keyValue: string
  ): APIKeyData {
    const additionalData = `${service}:${keyName}`;
    const encryptedKey = this.encrypt(keyValue, additionalData);
    
    return {
      service,
      keyName,
      encryptedKey,
      createdAt: new Date(),
      isActive: true,
    };
  }

  /**
   * Retrieve API key from storage object
   */
  static getAPIKeyFromData(apiKeyData: APIKeyData): string {
    const additionalData = `${apiKeyData.service}:${apiKeyData.keyName}`;
    return this.decrypt(apiKeyData.encryptedKey, additionalData);
  }

  /**
   * Rotate API key (re-encrypt with new IV)
   */
  static rotateEncryption(encryptedData: EncryptedData, additionalData?: string): EncryptedData {
    // First decrypt the existing data
    const plaintext = this.decrypt(encryptedData, additionalData);
    
    // Then re-encrypt with new IV
    return this.encrypt(plaintext, additionalData);
  }

  /**
   * Validate encrypted data structure
   */
  static validateEncryptedData(data: any): data is EncryptedData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.encrypted === 'string' &&
      typeof data.iv === 'string' &&
      typeof data.authTag === 'string' &&
      typeof data.algorithm === 'string' &&
      data.algorithm === this.algorithm
    );
  }

  /**
   * Generate a secure random API key
   */
  static generateSecureAPIKey(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      result += charset[randomIndex];
    }
    
    return result;
  }

  /**
   * Hash API key for comparison (one-way)
   */
  static hashAPIKey(apiKey: string): string {
    const salt = crypto.randomBytes(this.saltLength);
    const hash = crypto.pbkdf2Sync(apiKey, salt, 100000, 32, 'sha256');
    
    return salt.toString('hex') + ':' + hash.toString('hex');
  }

  /**
   * Verify API key against hash
   */
  static verifyAPIKey(apiKey: string, hashedKey: string): boolean {
    try {
      const [saltHex, hashHex] = hashedKey.split(':');
      const salt = Buffer.from(saltHex, 'hex');
      const hash = Buffer.from(hashHex, 'hex');
      
      const computedHash = crypto.pbkdf2Sync(apiKey, salt, 100000, 32, 'sha256');
      
      return crypto.timingSafeEqual(hash, computedHash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Mask API key for logging (show only first and last few characters)
   */
  static maskAPIKey(apiKey: string, visibleChars: number = 4): string {
    if (!apiKey || apiKey.length <= visibleChars * 2) {
      return '*'.repeat(apiKey?.length || 8);
    }
    
    const start = apiKey.substring(0, visibleChars);
    const end = apiKey.substring(apiKey.length - visibleChars);
    const middle = '*'.repeat(apiKey.length - (visibleChars * 2));
    
    return `${start}${middle}${end}`;
  }

  /**
   * Create encrypted environment variables for deployment
   */
  static createEncryptedEnvVars(envVars: Record<string, string>): Record<string, EncryptedData> {
    const encrypted: Record<string, EncryptedData> = {};
    
    Object.entries(envVars).forEach(([key, value]) => {
      encrypted[key] = this.encrypt(value, `env:${key}`);
    });
    
    return encrypted;
  }

  /**
   * Decrypt environment variables
   */
  static decryptEnvVars(encryptedEnvVars: Record<string, EncryptedData>): Record<string, string> {
    const decrypted: Record<string, string> = {};
    
    Object.entries(encryptedEnvVars).forEach(([key, encryptedData]) => {
      decrypted[key] = this.decrypt(encryptedData, `env:${key}`);
    });
    
    return decrypted;
  }

  /**
   * Test encryption/decryption functionality
   */
  static testEncryption(): boolean {
    try {
      const testKey = 'test-api-key-12345';
      const testService = 'test-service';
      
      // Test basic encryption/decryption
      const encrypted = this.encrypt(testKey, testService);
      const decrypted = this.decrypt(encrypted, testService);
      
      if (decrypted !== testKey) {
        console.error('Basic encryption test failed');
        return false;
      }
      
      // Test API key data creation
      const apiKeyData = this.createAPIKeyData('test', 'main', testKey);
      const retrievedKey = this.getAPIKeyFromData(apiKeyData);
      
      if (retrievedKey !== testKey) {
        console.error('API key data test failed');
        return false;
      }
      
      // Test key rotation
      const rotated = this.rotateEncryption(encrypted, testService);
      const rotatedDecrypted = this.decrypt(rotated, testService);
      
      if (rotatedDecrypted !== testKey) {
        console.error('Key rotation test failed');
        return false;
      }
      
      console.log('All encryption tests passed');
      return true;
    } catch (error) {
      console.error('Encryption test failed:', error);
      return false;
    }
  }
}

// Export utility functions
export const {
  encrypt,
  decrypt,
  encryptServiceKeys,
  decryptServiceKeys,
  createAPIKeyData,
  getAPIKeyFromData,
  rotateEncryption,
  validateEncryptedData,
  generateSecureAPIKey,
  hashAPIKey,
  verifyAPIKey,
  maskAPIKey,
  createEncryptedEnvVars,
  decryptEnvVars,
  testEncryption,
} = APIKeyEncryptionService; 
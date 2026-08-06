import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { UserRepository } from '../repositories/UserRepository';
import { getConnection } from '../config/database';
import { sendOTPEmail as sendVerificationEmail } from './EmailService';

export class AuthService {
  private userRepository = new UserRepository();

  private async ensurePendingRegistrationsTable() {
    const connection = await getConnection();
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS pending_registrations (
          id INT PRIMARY KEY AUTO_INCREMENT,
          email VARCHAR(255) UNIQUE NOT NULL,
          fullName VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          householdSize INT NOT NULL DEFAULT 1,
          otp VARCHAR(6) NOT NULL,
          expiresAt DATETIME NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_expiresAt (expiresAt)
        )
      `);
    } finally {
      connection.release();
    }
  }

  // Register new user
  async register(email: string, fullName: string, password: string, householdSize: number) {
    await this.ensurePendingRegistrationsTable();

    const connection = await getConnection();
    try {
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      const [pendingRows] = await connection.execute(
        `SELECT id FROM pending_registrations WHERE email = ? AND expiresAt > NOW()`,
        [email]
      );

      if ((pendingRows as any[]).length > 0) {
        await connection.execute(`DELETE FROM pending_registrations WHERE email = ?`, [email]);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = this.generateOTP();

      const [result] = await connection.execute(
        `INSERT INTO pending_registrations (email, fullName, password, householdSize, otp, expiresAt)
         VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
        [email, fullName, hashedPassword, householdSize, otp]
      );

      return {
        id: (result as any).insertId,
        email,
        fullName,
        otp,
      };
    } finally {
      connection.release();
    }
  }

  // Login user
  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!(user as any).emailVerified) {
      throw new Error('Please verify your email before logging in');
    }

    // Check password
    const validPassword = await bcrypt.compare(password, (user as any).password);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken((user as any).id, email);
    const refreshToken = this.generateRefreshToken((user as any).id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: (user as any).id,
        email: (user as any).email,
        fullName: (user as any).fullName,
        emailVerified: (user as any).emailVerified,
      },
    };
  }

  // Refresh access token
  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, jwtConfig.refreshSecret) as any;
      const user = await this.userRepository.findById(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }

      const accessToken = this.generateAccessToken(decoded.id, (user as any).email);
      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Generate access token
  generateAccessToken(userId: number, email: string): string {
    return jwt.sign(
      { id: userId, email },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
  }

  // Generate refresh token
  generateRefreshToken(userId: number): string {
    return jwt.sign(
      { id: userId },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiresIn }
    );
  }

  // Generate OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();


  }

  // Send OTP email
  async sendOTPEmail(email: string, otp: string): Promise<void> {
    await sendVerificationEmail(email, otp);
  }

  // Verify OTP
  async verifyOTP(userId: number, otp: string): Promise<void> {
    const isValid = await this.validateOTP(userId, otp);
    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    const connection = await getConnection();
    try {
      // Mark email as verified
      await this.userRepository.updateEmailVerification(userId, true);

      // Delete used OTP
      await connection.execute(
        `DELETE FROM otp_verifications WHERE userId = ?`,
        [userId]
      );
    } finally {
      connection.release();
    }
  }

  async completeRegistration(pendingId: number, otp: string): Promise<{ id: number; email: string; fullName: string }> {
    await this.ensurePendingRegistrationsTable();

    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM pending_registrations WHERE id = ? AND otp = ? AND expiresAt > NOW()`,
        [pendingId, otp]
      );

      const pending = (rows as any[])[0];
      if (!pending) {
        throw new Error('Invalid or expired OTP');
      }

      const existingUser = await this.userRepository.findByEmail(pending.email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      const [result] = await connection.execute(
        `INSERT INTO users (email, fullName, password, householdSize, emailVerified)
         VALUES (?, ?, ?, ?, TRUE)`,
        [pending.email, pending.fullName, pending.password, pending.householdSize]
      );

      await connection.execute(
        `INSERT INTO user_settings (userId) VALUES (?)`,
        [(result as any).insertId]
      );

      await connection.execute(
        `DELETE FROM pending_registrations WHERE id = ?`,
        [pendingId]
      );

      return {
        id: (result as any).insertId,
        email: pending.email,
        fullName: pending.fullName,
      };
    } finally {
      connection.release();
    }
  }

  async validateOTP(userId: number, otp: string): Promise<boolean> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM otp_verifications WHERE userId = ? AND otp = ? AND expiresAt > NOW()`,
        [userId, otp]
      );

      return (rows as any[]).length > 0;
    } finally {
      connection.release();
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: (user as any).id, type: 'reset' },
      jwtConfig.secret,
      { expiresIn: '1h' }
    );

    // Store reset token in database
    const connection = await getConnection();
    try {
      await connection.execute(
        `DELETE FROM password_reset_tokens WHERE userId = ?`,
        [(user as any).id]
      );

      await connection.execute(
        `INSERT INTO password_reset_tokens (userId, token, expiresAt) 
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
        [(user as any).id, resetToken]
      );
    } finally {
      connection.release();
    }

    return resetToken;
  }

  // Reset password
  async resetPassword(userId: number, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updatePassword(userId, hashedPassword);

    const connection = await getConnection();
    try {
      await connection.execute(
        `DELETE FROM otp_verifications WHERE userId = ?`,
        [userId]
      );
    } finally {
      connection.release();
    }
  }

  // Update password (authenticated)
  async updatePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, (user as any).password);
    if (!validPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updatePassword(userId, hashedPassword);
  }
}

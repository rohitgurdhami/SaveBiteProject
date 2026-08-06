import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { sendSuccess, sendError } from '../utils/response';
import { registerSchema, loginSchema } from '../validations';
import { getConnection } from '../config/database';

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);

    const pendingRegistration = await authService.register(
      validated.email,
      validated.fullName,
      validated.password,
      validated.householdSize
    );

    await authService.sendOTPEmail(validated.email, pendingRegistration.otp);

    sendSuccess(
      res,
      { pendingRegistrationId: pendingRegistration.id, email: pendingRegistration.email },
      'Verification code sent. Please verify your email to finish registration.',
      201
    );
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);

    const result = await authService.login(validated.email, validated.password);

    sendSuccess(res, result, 'Login successful');
  } catch (error: any) {
    sendError(res, error.message, error.message.includes('verify your email') ? 403 : 401);
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendError(res, 'Refresh token is required', 400);
    }

    const result = await authService.refreshToken(refreshToken);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message, 401);
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { pendingRegistrationId, userId, otp } = req.body;
    if (!otp || (!pendingRegistrationId && !userId)) {
      return sendError(res, 'OTP and registration reference are required', 400);
    }

    if (pendingRegistrationId) {
      const user = await authService.completeRegistration(Number(pendingRegistrationId), otp);
      return sendSuccess(res, { userId: user.id, email: user.email }, 'Email verified and account created successfully');
    }

    await authService.verifyOTP(Number(userId), otp);
    sendSuccess(res, null, 'Email verified successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'Email is required', 400);
    }

    const userRepo = new UserRepository();
    const user = await userRepo.findByEmail(email);

    if (!user || (user as any).emailVerified) {
      return sendError(res, 'User not found or already verified', 400);
    }

    const otp = authService.generateOTP();
    await authService.sendOTPEmail(email, otp);

    // Update OTP in database
    const connection = await getConnection();
    try {
      await connection.execute(
        `DELETE FROM otp_verifications WHERE userId = ?`,
        [(user as any).id]
      );

      await connection.execute(
        `INSERT INTO otp_verifications (userId, otp, expiresAt) 
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
        [(user as any).id, otp]
      );
    } finally {
      connection.release();
    }

    sendSuccess(res, null, 'OTP sent to your email');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'Email is required', 400);
    }

    const userRepo = new UserRepository();
    const user = await userRepo.findByEmail(email);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const otp = authService.generateOTP();
    await authService.sendOTPEmail(email, otp);

    const connection = await getConnection();
    try {
      await connection.execute(`DELETE FROM otp_verifications WHERE userId = ?`, [(user as any).id]);
      await connection.execute(
        `INSERT INTO otp_verifications (userId, otp, expiresAt) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
        [(user as any).id, otp]
      );
    } finally {
      connection.release();
    }

    sendSuccess(res, { userId: (user as any).id, email }, 'Password reset code sent to email');
  } catch (error: any) {
    sendError(res, error.message, 404);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { userId, otp, newPassword } = req.body;
    if (!userId || !otp || !newPassword) {
      return sendError(res, 'User ID, OTP and new password are required', 400);
    }

    const isValid = await authService.validateOTP(Number(userId), otp);
    if (!isValid) {
      return sendError(res, 'Invalid or expired OTP', 400);
    }

    await authService.resetPassword(Number(userId), newPassword);
    sendSuccess(res, null, 'Password reset successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 'Current and new password are required', 400);
    }

    const userId = req.user!.id;
    await authService.updatePassword(userId, currentPassword, newPassword);
    sendSuccess(res, null, 'Password changed successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userRepo = new UserRepository();
    const user = await userRepo.findById(req.user!.id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user as any;
    sendSuccess(res, userWithoutPassword);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

const ensureProfileTables = async () => {
  const connection = await getConnection();
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        userId INT NOT NULL UNIQUE,
        phone VARCHAR(30),
        address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        zipCode VARCHAR(20),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId)
      )
    `);
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        userId INT NOT NULL UNIQUE,
        emailNotifications BOOLEAN DEFAULT TRUE,
        pushNotifications BOOLEAN DEFAULT TRUE,
        notificationsEnabled BOOLEAN DEFAULT TRUE,
        showDonationsPublicly BOOLEAN DEFAULT TRUE,
        darkMode BOOLEAN DEFAULT FALSE,
        privacyLevel ENUM('public', 'private', 'friends') DEFAULT 'private',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId)
      )
    `);
    const [settingsColumns] = await connection.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_settings' AND COLUMN_NAME = 'showDonationsPublicly'`
    );

    if ((settingsColumns as any[]).length === 0) {
      await connection.execute(`ALTER TABLE user_settings ADD COLUMN showDonationsPublicly BOOLEAN DEFAULT TRUE AFTER notificationsEnabled`);
    }
  } finally {
    connection.release();
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    await ensureProfileTables();
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT u.id, u.email, u.fullName, u.householdSize, u.emailVerified,
                COALESCE(up.phone, '') AS phone,
                COALESCE(up.address, '') AS address,
                COALESCE(up.city, '') AS city,
                COALESCE(up.state, '') AS state,
                COALESCE(up.zipCode, '') AS zipCode,
                COALESCE(us.emailNotifications, TRUE) AS emailNotifications,
                COALESCE(us.pushNotifications, TRUE) AS pushNotifications,
                COALESCE(us.expiryAlerts, TRUE) AS expiryAlerts,
                COALESCE(us.donationUpdates, TRUE) AS donationUpdates,
                COALESCE(us.weeklyDigest, FALSE) AS weeklyDigest
         FROM users u
         LEFT JOIN user_profiles up ON up.userId = u.id
         LEFT JOIN user_settings us ON us.userId = u.id
         WHERE u.id = ? LIMIT 1`,
        [req.user!.id]
      );

      const profile = (rows as any[])[0];
      if (!profile) {
        return sendError(res, 'User not found', 404);
      }

      sendSuccess(res, profile);
    } finally {
      connection.release();
    }
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    await ensureProfileTables();
    const { fullName, phone, address, city, state, zipCode } = req.body;
    const connection = await getConnection();
    try {
      await connection.execute(
        `UPDATE users SET fullName = ? WHERE id = ?`,
        [fullName, req.user!.id]
      );

      await connection.execute(
        `INSERT INTO user_profiles (userId, phone, address, city, state, zipCode)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE phone = VALUES(phone), address = VALUES(address),
         city = VALUES(city), state = VALUES(state), zipCode = VALUES(zipCode)`,
        [req.user!.id, phone || null, address || null, city || null, state || null, zipCode || null]
      );
    } finally {
      connection.release();
    }

    const userRepo = new UserRepository();
    const user = await userRepo.findById(req.user!.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const { password, ...userWithoutPassword } = user as any;
    sendSuccess(res, userWithoutPassword, 'Profile updated successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    await ensureProfileTables();
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT darkMode, notificationsEnabled, emailNotifications, pushNotifications, showDonationsPublicly, privacyLevel
         FROM user_settings WHERE userId = ? LIMIT 1`,
        [req.user!.id]
      );

      const settings = (rows as any[])[0] || {
        darkMode: false,
        notificationsEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        showDonationsPublicly: true,
        privacyLevel: 'private',
      };

      sendSuccess(res, settings);
    } finally {
      connection.release();
    }
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    await ensureProfileTables();
    const {
      darkMode = false,
      notificationsEnabled = true,
      emailNotifications = true,
      pushNotifications = true,
      showDonationsPublicly = true,
      privacyLevel = 'private',
    } = req.body;

    const connection = await getConnection();
    try {
      await connection.execute(
        `INSERT INTO user_settings (userId, darkMode, notificationsEnabled, emailNotifications, pushNotifications, showDonationsPublicly, privacyLevel)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE emailNotifications = VALUES(emailNotifications),
         pushNotifications = VALUES(pushNotifications), notificationsEnabled = VALUES(notificationsEnabled),
         showDonationsPublicly = VALUES(showDonationsPublicly),
         darkMode = VALUES(darkMode), privacyLevel = VALUES(privacyLevel)`,
        [req.user!.id, !!darkMode, !!notificationsEnabled, !!emailNotifications, !!pushNotifications, !!showDonationsPublicly, privacyLevel]
      );
    } finally {
      connection.release();
    }

    sendSuccess(res, null, 'Settings updated successfully');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

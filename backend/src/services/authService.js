const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { AuthenticationError, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 10;

/**
 * Register a new user
 */
exports.register = async (userData) => {
  const { email, password, firstName, lastName } = userData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (existingUser) {
    throw new ValidationError('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'user'
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true
    }
  });

  logger.info(`New user registered: ${email}`);

  // Generate JWT
  const token = generateToken(user);

  return { user, token };
};

/**
 * Login user
 */
exports.login = async (email, password) => {
  // Find user
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { team: true }
  });

  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  logger.info(`User logged in: ${email}`);

  // Generate JWT
  const token = generateToken(user);

  // Remove sensitive data
  const { passwordHash, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

/**
 * Verify JWT token
 */
exports.verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token expired');
    }
    throw new AuthenticationError('Invalid token');
  }
};

/**
 * Get user by ID
 */
exports.getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { team: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
          plan: true,
          maxCompanies: true,
          maxContacts: true,
          maxApiCalls: true,
          apiCallsUsed: true
        }
      },
      isActive: true,
      lastLoginAt: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  return user;
};

/**
 * Request password reset
 */
exports.requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Don't reveal if user exists
    logger.info(`Password reset requested for non-existent email: ${email}`);
    return { message: 'If email exists, reset link will be sent' };
  }

  // Generate reset token (valid for 1 hour)
  const resetToken = jwt.sign(
    { userId: user.id, type: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  logger.info(`Password reset token generated for: ${email}`);

  // TODO: Send email with reset link
  // For now, just return the token (in production, would send email)
  
  return { 
    message: 'Password reset email sent',
    // Remove this in production:
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
  };
};

/**
 * Reset password with token
 */
exports.resetPassword = async (resetToken, newPassword) => {
  let decoded;
  
  try {
    decoded = jwt.verify(resetToken, JWT_SECRET);
  } catch (error) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  if (decoded.type !== 'password_reset') {
    throw new AuthenticationError('Invalid reset token');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: decoded.userId },
    data: { passwordHash }
  });

  logger.info(`Password reset successful for user: ${decoded.userId}`);

  return { message: 'Password reset successful' };
};

/**
 * Update password (authenticated user)
 */
exports.updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });

  logger.info(`Password updated for user:  ${userId}`);

  return { message: 'Password updated successfully' };
};

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      teamId: user.teamId
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

module.exports = exports;

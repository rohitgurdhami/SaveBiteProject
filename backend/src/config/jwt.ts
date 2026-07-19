export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key',
  expiresIn: process.env.JWT_EXPIRE || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
};

export const emailConfig = {
  user: process.env.EMAIL_USER || '',
  pass: process.env.EMAIL_PASS || '',
  from: process.env.EMAIL_FROM || 'noreply@savebite.com',
};

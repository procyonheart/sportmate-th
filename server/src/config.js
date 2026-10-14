import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || '',
  // Neon: direct (non-pooler) URL for migrations/DDL; falls back to pooled.
  databaseUrlUnpooled: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  siteUrl: process.env.SITE_URL || 'https://procyonheart.github.io/sportmate-th',
  // comma-separated list of allowed CORS origins
  corsOrigins: (process.env.CORS_ORIGINS ||
    'https://procyonheart.github.io,http://localhost:3000')
    .split(',').map((s) => s.trim()).filter(Boolean),
  resendApiKey: process.env.RESEND_API_KEY || '',
  mailFrom: process.env.MAIL_FROM || 'SportMate TH <onboarding@resend.dev>',
  adminEmail: process.env.ADMIN_EMAIL || '',
  cloudinaryUrl: process.env.CLOUDINARY_URL || '',
};

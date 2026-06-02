import { logger } from '@/lib/logger'

export const emailService = {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    logger.info({ email, tokenPrefix: token.slice(0, 8) }, 'Sending verification email')
    // TODO: implement via SendGrid using SENDGRID_API_KEY
  },

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    logger.info({ email, tokenPrefix: token.slice(0, 8) }, 'Sending password reset email')
    // TODO: implement via SendGrid
  },

  async sendSessionConfirmationEmail(email: string, sessionId: string): Promise<void> {
    logger.info({ email, sessionId }, 'Sending session confirmation email')
    // TODO: implement via SendGrid
  },

  async sendSessionReminderEmail(email: string, sessionId: string, minutesBefore: number): Promise<void> {
    logger.info({ email, sessionId, minutesBefore }, 'Sending session reminder email')
    // TODO: implement via SendGrid
  },

  async sendCancellationEmail(email: string, sessionId: string): Promise<void> {
    logger.info({ email, sessionId }, 'Sending cancellation email')
    // TODO: implement via SendGrid
  },
}

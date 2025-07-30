import { prisma } from '@/lib/prisma';
import { toZonedTime } from 'date-fns-tz';
import type {
  EmailData,
  AppointmentEmailData,
  EmailLogInput,
  EmailSendResult,
} from './types';
import { emailTemplates } from './email.templates';

const token =
  process.env.MAILTRAP_API_TOKEN || '6ab07fc7035c315cf6967814daeab66f';
const testInboxId = Number(process.env.MAILTRAP_INBOX_ID) || 3928333;
const TIMEZONE = 'America/Rio_Branco';

if (!token || !testInboxId) {
  throw new Error('MAILTRAP_API_TOKEN e MAILTRAP_INBOX_ID são obrigatórios.');
}

const MAILTRAP_API_URL = `https://sandbox.api.mailtrap.io/api/send/${testInboxId}`;

export const emailService = {
  // Enviar email via Mailtrap REST API
  sendEmailViaMailtrap: async (emailData: EmailData): Promise<void> => {
    try {
      console.log('Sending email via Mailtrap REST API:', {
        to: emailData.to,
        subject: emailData.subject,
        category: emailData.category,
        testInboxId,
      });

      const payload = {
        from: {
          email:
            emailData.from ||
            process.env.DEFAULT_FROM_EMAIL ||
            'noreply@sejusp.gov.br',
          name: 'SEJUSP - Vibe Seat',
        },
        to: [
          {
            email: emailData.to,
          },
        ],
        subject: emailData.subject,
        text: emailData.text || 'Email enviado pelo sistema SEJUSP - Vibe Seat',
        html: emailData.html,
        category: emailData.category || 'appointment',
      };

      const response = await fetch(MAILTRAP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Api-Token': token,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      console.log(`Email enviado com sucesso para ${emailData.to}`, result);
    } catch (error) {
      console.error('Erro no envio Mailtrap REST API:', error);
      throw new Error(
        `Falha no envio do email: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  },

  getDefaultFromEmail: () => {
    return process.env.DEFAULT_FROM_EMAIL || 'noreply@sejusp.gov.br';
  },

  // Criar log de email no banco
  createEmailLog: async (input: EmailLogInput) => {
    return prisma.emailLog.create({
      data: {
        appointmentId: input.appointmentId,
        emailType: input.emailType,
        recipientEmail: input.recipientEmail,
        subject: input.subject,
        category: input.category,
        status: 'PENDING',
      },
    });
  },

  // Atualizar status do email log
  updateEmailLogStatus: async (
    id: number,
    status: 'SENT' | 'FAILED',
    errorMessage?: string
  ) => {
    return prisma.emailLog.update({
      where: { id },
      data: {
        status,
        sentAt: status === 'SENT' ? new Date() : undefined,
        errorMessage,
      },
    });
  },

  // Verificar se email já foi enviado
  checkEmailAlreadySent: async (
    appointmentId: number,
    emailType: 'CONFIRMATION' | 'REMINDER' | 'CREATED'
  ) => {
    const emailLog = await prisma.emailLog.findFirst({
      where: {
        appointmentId,
        emailType,
        status: 'SENT',
      },
    });
    return !!emailLog;
  },

  // Enviar email genérico
  sendEmail: async (emailData: EmailData): Promise<void> => {
    return emailService.sendEmailViaMailtrap(emailData);
  },

  // Enviar email de appointment com log
  sendAppointmentEmail: async (
    appointmentData: AppointmentEmailData,
    emailType: 'CONFIRMATION' | 'REMINDER' | 'CREATED'
  ): Promise<EmailSendResult> => {
    try {
      // Verificar se email já foi enviado
      const alreadySent = await emailService.checkEmailAlreadySent(
        appointmentData.appointmentId,
        emailType
      );

      if (alreadySent) {
        console.log(
          `Email ${emailType} already sent for appointment ${appointmentData.appointmentId}`
        );
        return { success: true };
      }

      // Gerar template
      const templateType = emailType.toLowerCase() as
        | 'confirmation'
        | 'reminder'
        | 'created';
      const template = emailTemplates[templateType](appointmentData);

      // Criar log no banco
      const emailLog = await emailService.createEmailLog({
        appointmentId: appointmentData.appointmentId,
        emailType,
        recipientEmail: appointmentData.userEmail,
        subject: template.subject,
        category: `appointment-${templateType}`,
      });

      try {
        // Enviar email
        await emailService.sendEmail({
          to: appointmentData.userEmail,
          subject: template.subject,
          html: template.html,
          category: `appointment-${templateType}`,
        });

        // Atualizar log como enviado
        await emailService.updateEmailLogStatus(emailLog.id, 'SENT');

        console.log(
          `Appointment ${emailType} email sent to ${appointmentData.userEmail}`
        );
        return { success: true, emailLogId: emailLog.id };
      } catch (error) {
        // Atualizar log como falhado
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        await emailService.updateEmailLogStatus(
          emailLog.id,
          'FAILED',
          errorMessage.length > 255
            ? errorMessage.substring(0, 255)
            : errorMessage
        );
        throw error;
      }
    } catch (error) {
      console.error(`Error sending appointment ${emailType} email:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Enviar email de agendamento criado
  sendCreatedEmail: async (
    appointmentData: AppointmentEmailData
  ): Promise<EmailSendResult> => {
    return emailService.sendAppointmentEmail(appointmentData, 'CREATED');
  },

  // Enviar email de confirmação
  sendConfirmationEmail: async (
    appointmentData: AppointmentEmailData
  ): Promise<EmailSendResult> => {
    return emailService.sendAppointmentEmail(appointmentData, 'CONFIRMATION');
  },

  // Enviar email de lembrete
  sendReminderEmail: async (
    appointmentData: AppointmentEmailData
  ): Promise<EmailSendResult> => {
    return emailService.sendAppointmentEmail(appointmentData, 'REMINDER');
  },

  // Buscar appointments que precisam de lembrete
  getAppointmentsForReminder: async (timeWindowMinutes: number = 60) => {
    // Usar timezone local do Acre em vez de UTC
    const now = toZonedTime(new Date(), TIMEZONE);
    const startTime = new Date(
      now.getTime() + (timeWindowMinutes - 15) * 60000
    ); // 45min a partir de agora
    const endTime = new Date(now.getTime() + (timeWindowMinutes + 15) * 60000); // 75min a partir de agora

    return prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        datetimeStart: {
          gte: startTime,
          lte: endTime,
        },
        // Não incluir appointments que já tem email de lembrete enviado
        emailLogs: {
          none: {
            emailType: 'REMINDER',
            status: 'SENT',
          },
        },
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        chair: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });
  },
};

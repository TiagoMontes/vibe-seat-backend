import * as cron from 'node-cron';
import { emailService } from './email.service';
import type { AppointmentEmailData } from './types';

export const emailScheduler = {
  // Job para enviar lembretes
  reminderJob: null as cron.ScheduledTask | null,

  // Processar lembretes de appointments
  processReminders: async () => {
    try {
      console.log('🔔 Running email reminder job...');

      const appointments = await emailService.getAppointmentsForReminder(60); // 1 hora

      if (appointments.length === 0) {
        console.log('No appointments need reminders at this time');
        return;
      }

      console.log(
        `Found ${appointments.length} appointments that need reminder emails`
      );

      for (const appointment of appointments) {
        if (!appointment.user.email || !appointment.user.fullName) {
          console.warn(
            `Appointment ${appointment.id} missing user email or name, skipping reminder`
          );
          continue;
        }

        const appointmentData: AppointmentEmailData = {
          appointmentId: appointment.id,
          userName: appointment.user.fullName,
          userEmail: appointment.user.email,
          chairName: appointment.chair.name,
          chairLocation: appointment.chair.location || undefined,
          datetimeStart: appointment.datetimeStart,
          datetimeEnd: appointment.datetimeEnd,
        };

        try {
          const result = await emailService.sendReminderEmail(appointmentData);

          if (result.success) {
            console.log(
              `✅ Reminder sent for appointment ${appointment.id} to ${appointment.user.email}`
            );
          } else {
            console.error(
              `❌ Failed to send reminder for appointment ${appointment.id}: ${result.error}`
            );
          }
        } catch (error) {
          console.error(
            `❌ Error sending reminder for appointment ${appointment.id}:`,
            error
          );
        }
      }

      console.log('✅ Email reminder job completed');
    } catch (error) {
      console.error('❌ Error in email reminder job:', error);
    }
  },

  // Iniciar scheduler
  start: () => {
    if (emailScheduler.reminderJob) {
      console.log('📧 Email scheduler is already running');
      return;
    }

    // Executar a cada 15 minutos
    emailScheduler.reminderJob = cron.schedule(
      '*/15 * * * *',
      emailScheduler.processReminders,
      {
        timezone: 'America/Rio_Branco',
      }
    );

    console.log('📧 Email scheduler started - running every 15 minutes');
  },

  // Parar scheduler
  stop: () => {
    if (emailScheduler.reminderJob) {
      emailScheduler.reminderJob.stop();
      emailScheduler.reminderJob = null;
      console.log('📧 Email scheduler stopped');
    }
  },

  // Executar manualmente (para testes)
  runNow: async () => {
    console.log('📧 Running email scheduler manually...');
    await emailScheduler.processReminders();
  },

  // Verificar se está rodando
  isRunning: (): boolean => {
    return emailScheduler.reminderJob !== null;
  },
};

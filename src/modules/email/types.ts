export interface EmailData {
  to: string;
  subject: string;
  from?: string;
  html?: string;
  text?: string;
  category?: string;
}

export interface AppointmentEmailData {
  appointmentId: number;
  userName: string;
  userEmail: string;
  chairName: string;
  chairLocation?: string;
  datetimeStart: Date;
  datetimeEnd: Date;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface EmailLogInput {
  appointmentId: number;
  emailType: 'CONFIRMATION' | 'REMINDER' | 'CREATED';
  recipientEmail: string;
  subject: string;
  category?: string;
}

export interface EmailSendResult {
  success: boolean;
  emailLogId?: number;
  error?: string;
}

import type { AppointmentEmailData, EmailTemplate } from './types';

export const emailTemplates = {
  // Template para agendamento criado
  created: (data: AppointmentEmailData): EmailTemplate => {
    const formatDate = (date: Date) => {
      // Frontend já envia no horário local correto, não precisa converter timezone
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const formatTime = (date: Date) => {
      // Frontend já envia no horário local correto, não precisa converter timezone
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    return {
      subject: `Agendamento Criado - ${formatDate(data.datetimeStart)}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Agendamento Criado</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #28a745;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #28a745;
              margin: 0;
            }
            .status-created {
              background: #d4edda;
              color: #155724;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              display: inline-block;
              margin-bottom: 20px;
            }
            .appointment-details {
              background: #f8f9fa;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              align-items: center;
            }
            .detail-label {
              font-weight: 600;
              color: #555;
            }
            .detail-value {
              color: #333;
              font-weight: 500;
            }
            .info-box {
              background: #e7f3ff;
              border: 1px solid #b3d9ff;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🪑 Vibe Seat</h1>
              <p>Seu agendamento foi criado com sucesso!</p>
            </div>
            
            <div style="text-align: center;">
              <span class="status-created">✅ Agendamento Criado</span>
            </div>
            
            <div class="appointment-details">
              <h3>Detalhes do Agendamento</h3>
              
              <div class="detail-row">
                <span class="detail-label">Data:</span>
                <span class="detail-value">${formatDate(data.datetimeStart)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Horário:</span>
                <span class="detail-value">${formatTime(data.datetimeStart)} às ${formatTime(data.datetimeEnd)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Cadeira:</span>
                <span class="detail-value">${data.chairName}</span>
              </div>
              
              ${
                data.chairLocation
                  ? `
              <div class="detail-row">
                <span class="detail-label">Localização:</span>
                <span class="detail-value">${data.chairLocation}</span>
              </div>
              `
                  : ''
              }
              
              <div class="detail-row">
                <span class="detail-label">Usuário:</span>
                <span class="detail-value">${data.userName}</span>
              </div>
            </div>
            
            <div class="info-box">
              <p style="margin: 0; color: #0c5460;">
                <strong>ℹ️ Status:</strong> Seu agendamento está aguardando confirmação. 
                Você receberá um email quando sua presença for confirmada pelo atendente.
              </p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong> Lembrete:</strong> Chegue alguns minutos antes do horário agendado. 
                Apresente-se ao atendente para confirmar sua presença.
              </p>
            </div>
            
            <div class="footer">
              <p>Este é um e-mail automático. Por favor, não responda.</p>
              <p><strong>SEJUSP</strong> - Sistema de Agendamento de Cadeiras de Massagem</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  },

  confirmation: (data: AppointmentEmailData): EmailTemplate => {
    const formatDate = (date: Date) => {
      // Frontend já envia no horário local correto, não precisa converter timezone
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const formatTime = (date: Date) => {
      // Frontend já envia no horário local correto, não precisa converter timezone
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    return {
      subject: `Confirmação de Agendamento - ${formatDate(data.datetimeStart)}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmação de Agendamento</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #0066cc;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #0066cc;
              margin: 0;
            }
            .appointment-details {
              background: #f8f9fa;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              align-items: center;
            }
            .detail-label {
              font-weight: 600;
              color: #555;
            }
            .detail-value {
              color: #333;
              font-weight: 500;
            }
            .status-confirmed {
              background: #d4edda;
              color: #155724;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              display: inline-block;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🪑 Vibe Seat</h1>
              <p>Seu agendamento foi confirmado!</p>
            </div>
            
            <div class="appointment-details">
              <h2>Detalhes do Agendamento</h2>
              
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="status-confirmed">✅ CONFIRMADO</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Data:</span>
                <span class="detail-value">${formatDate(data.datetimeStart)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Horário:</span>
                <span class="detail-value">${formatTime(data.datetimeStart)} às ${formatTime(data.datetimeEnd)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Cadeira:</span>
                <span class="detail-value">${data.chairName}</span>
              </div>
              
              ${
                data.chairLocation
                  ? `
              <div class="detail-row">
                <span class="detail-label">Localização:</span>
                <span class="detail-value">${data.chairLocation}</span>
              </div>
              `
                  : ''
              }
              
              <div class="detail-row">
                <span class="detail-label">Usuário:</span>
                <span class="detail-value">${data.userName}</span>
              </div>
            </div>
            
            <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #0066cc;">
                <strong>📱 Lembrete:</strong> Você receberá um e-mail de lembrete 1 hora antes do seu agendamento.
              </p>
            </div>
            
            <div class="footer">
              <p>Este é um e-mail automático. Por favor, não responda.</p>
              <p><strong>SEJUSP</strong> - Sistema de Agendamento de Cadeiras de Massagem</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  },

  reminder: (data: AppointmentEmailData): EmailTemplate => {
    const formatDate = (date: Date) => {
      // Frontend já envia no horário local correto, não precisa converter timezone
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const formatTime = (date: Date) => {
      // Frontend já envia no horário local correto, não precisa converter timezone
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    return {
      subject: `🔔 Lembrete: Seu agendamento é em 1 hora - ${formatTime(data.datetimeStart)}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lembrete de Agendamento</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #ff9500;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #ff9500;
              margin: 0;
            }
            .reminder-alert {
              background: linear-gradient(135deg, #ff9500, #ffb84d);
              color: white;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              margin-bottom: 25px;
            }
            .reminder-alert h2 {
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .appointment-details {
              background: #f8f9fa;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              align-items: center;
            }
            .detail-label {
              font-weight: 600;
              color: #555;
            }
            .detail-value {
              color: #333;
              font-weight: 500;
            }
            .time-highlight {
              background: #fff3cd;
              border: 2px solid #ffc107;
              padding: 15px;
              border-radius: 6px;
              text-align: center;
              margin: 20px 0;
            }
            .time-highlight .time {
              font-size: 28px;
              font-weight: bold;
              color: #856404;
              margin: 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🪑 Vibe Seat</h1>
              <p>Lembrete do seu agendamento</p>
            </div>
            
            <div class="reminder-alert">
              <h2>🔔 Atenção!</h2>
              <p style="margin: 0; font-size: 18px;">Seu agendamento é em <strong>1 hora</strong></p>
            </div>
            
            <div class="time-highlight">
              <p style="margin: 0 0 5px 0; color: #856404; font-weight: 600;">Horário do agendamento:</p>
              <p class="time">${formatTime(data.datetimeStart)} às ${formatTime(data.datetimeEnd)}</p>
            </div>
            
            <div class="appointment-details">
              <h3>Detalhes do Agendamento</h3>
              
              <div class="detail-row">
                <span class="detail-label">Data:</span>
                <span class="detail-value">${formatDate(data.datetimeStart)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Cadeira:</span>
                <span class="detail-value">${data.chairName}</span>
              </div>
              
              ${
                data.chairLocation
                  ? `
              <div class="detail-row">
                <span class="detail-label">Localização:</span>
                <span class="detail-value">${data.chairLocation}</span>
              </div>
              `
                  : ''
              }
              
              <div class="detail-row">
                <span class="detail-label">Usuário:</span>
                <span class="detail-value">${data.userName}</span>
              </div>
            </div>
            
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #0c5460;">
                <strong>💡 Dica:</strong> Chegue alguns minutos antes do horário agendado para aproveitar melhor sua sessão de massagem.
              </p>
            </div>
            
            <div class="footer">
              <p>Este é um e-mail automático. Por favor, não responda.</p>
              <p><strong>SEJUSP</strong> - Sistema de Agendamento de Cadeiras de Massagem</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  },
};

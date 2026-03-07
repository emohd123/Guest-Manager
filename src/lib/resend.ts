import { Resend } from "resend";

export interface RegistrationEmailData {
  to: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string;
  orderNumber: string;
  tickets: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  isFree: boolean;
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

function getFromEmail() {
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  if (!fromEmail) {
    throw new Error("RESEND_FROM_EMAIL is not configured");
  }
  return fromEmail;
}

export async function sendRegistrationConfirmation(data: RegistrationEmailData) {
  const resend = getResendClient();
  const fromEmail = getFromEmail();

  const ticketRows = data.tickets
    .map(
      (ticket) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${ticket.name} x ${ticket.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
            ${ticket.price === 0 ? "Free" : `$${((ticket.price * ticket.quantity) / 100).toFixed(2)}`}
          </td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registration Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #377DFF, #2563eb); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">You're registered!</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 15px;">
                Your spot is confirmed for <strong>${data.eventTitle}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 15px;">
                Hi <strong>${data.attendeeName}</strong>,<br /><br />
                Thanks for registering! Here are your order details:
              </p>

              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-weight: 600; font-size: 16px; color: #111827;">${data.eventTitle}</p>
                <p style="margin: 6px 0 0; color: #6b7280; font-size: 14px;">${data.eventDate}</p>
                ${data.eventLocation ? `<p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">${data.eventLocation}</p>` : ""}
                <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">Order #${data.orderNumber}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                <thead>
                  <tr>
                    <th style="text-align: left; padding-bottom: 8px; color: #6b7280; font-weight: 500; border-bottom: 2px solid #f0f0f0;">Ticket</th>
                    <th style="text-align: right; padding-bottom: 8px; color: #6b7280; font-weight: 500; border-bottom: 2px solid #f0f0f0;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${ticketRows}
                </tbody>
                <tfoot>
                  <tr>
                    <td style="padding: 12px 0 0; font-weight: 700; color: #111827;">Total</td>
                    <td style="padding: 12px 0 0; font-weight: 700; color: #111827; text-align: right;">
                      ${data.isFree ? "Free" : `$${(data.total / 100).toFixed(2)}`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                Powered by <a href="https://guestmanager.com" style="color: #377DFF; text-decoration: none;">GuestManager</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `You're registered for ${data.eventTitle}!\n\nHi ${data.attendeeName},\n\nThanks for registering!\n\nEvent: ${data.eventTitle}\nDate: ${data.eventDate}\n${data.eventLocation ? `Location: ${data.eventLocation}\n` : ""}Order #${data.orderNumber}\n\nTickets:\n${data.tickets
    .map((ticket) => `- ${ticket.name} x ${ticket.quantity}: ${ticket.price === 0 ? "Free" : `$${((ticket.price * ticket.quantity) / 100).toFixed(2)}`}`)
    .join("\n")}\n\nTotal: ${data.isFree ? "Free" : `$${(data.total / 100).toFixed(2)}`}\n\nPowered by GuestManager`;

  return resend.emails.send({
    from: fromEmail,
    to: data.to,
    subject: `Registration Confirmed: ${data.eventTitle}`,
    html,
    text,
  });
}

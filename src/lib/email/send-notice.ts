import { Resend } from 'resend';
import type { NoticeEmailData } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'notices@yourdomain.com';
const FROM_NAME = process.env.FROM_NAME || 'Trust Notice System';

export async function sendNoticeEmail(data: NoticeEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Notice of Right to Withdraw Funds - ${data.trustName}`;

  const html = generateNoticeEmailHtml(data);
  const text = generateNoticeEmailText(data);

  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: data.beneficiaryName, // This is actually the email address when called from API
      subject,
      html,
      text,
      tags: [
        { name: 'type', value: 'crummey_notice' },
        { name: 'trust', value: data.trustName.replace(/[^a-zA-Z0-9]/g, '_') },
      ],
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

function generateNoticeEmailHtml(data: NoticeEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crummey Notice</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .notice-date { color: #666; }
    .amount { font-weight: bold; font-size: 1.1em; }
    .deadline { color: #c00; font-weight: bold; }
    .signature { margin-top: 40px; }
    .ack-section { background: #f5f5f5; padding: 20px; margin-top: 30px; border-radius: 5px; }
    .ack-button { display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <p class="notice-date">${data.noticeDate}</p>
    <p><strong>${data.trustName}</strong><br>Dated: ${data.trustDate}</p>
  </div>

  <p>To: ${data.beneficiaryName}</p>
  <p><strong>Re: Notice of Right to Withdraw Funds</strong></p>

  <p>Dear ${data.beneficiaryName.split(' ')[0]},</p>

  <p>This letter is to notify you that on <strong>${data.contributionDate}</strong>, a gift in the amount of <span class="amount">$${data.withdrawalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> was made to the ${data.trustName} of which you are a beneficiary.</p>

  <p>Under the terms of the trust, you have the right to withdraw a portion or all of this gift. Your withdrawal right will lapse <span class="deadline">on ${data.withdrawalDeadline}</span>. If you do not exercise your withdrawal right within this period, the gift will remain in trust and will be managed and distributed in accordance with the trust's terms.</p>

  <p>To exercise your right to withdraw, please contact ${data.trusteeName} at ${data.trusteeEmail}${data.trusteePhone ? ` or ${data.trusteePhone}` : ''} no later than ${data.withdrawalDeadline}.</p>

  <p>This notice is provided as a requirement under the trust agreement and tax regulations. It is not intended to encourage or discourage you from withdrawing the funds. If you have questions or need further clarification, please consult your personal attorney or advisor.</p>

  <div class="signature">
    <p>Sincerely,</p>
    <p><strong>${data.trusteeName}</strong>, Trustee<br>
    ${data.trusteeAddress}<br>
    ${data.trusteeEmail}${data.trusteePhone ? `<br>${data.trusteePhone}` : ''}</p>
  </div>

  <div class="ack-section">
    <p><strong>Beneficiary Acknowledgment</strong></p>
    <p>Please acknowledge receipt of this notice by clicking the button below. This acknowledgment confirms you received notice of your withdrawal rights and does not affect your ability to exercise or waive those rights.</p>
    <a href="${data.acknowledgmentUrl}" class="ack-button">Acknowledge Receipt</a>
  </div>

  <div class="footer">
    <p>This notice was sent electronically. A record of this notice and your acknowledgment will be maintained for the trust's records.</p>
  </div>
</body>
</html>
  `.trim();
}

function generateNoticeEmailText(data: NoticeEmailData): string {
  return `
${data.noticeDate}

${data.trustName}
Dated: ${data.trustDate}

To: ${data.beneficiaryName}

Re: Notice of Right to Withdraw Funds

Dear ${data.beneficiaryName.split(' ')[0]},

This letter is to notify you that on ${data.contributionDate}, a gift in the amount of $${data.withdrawalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} was made to the ${data.trustName} of which you are a beneficiary.

Under the terms of the trust, you have the right to withdraw a portion or all of this gift. Your withdrawal right will lapse on ${data.withdrawalDeadline}. If you do not exercise your withdrawal right within this period, the gift will remain in trust and will be managed and distributed in accordance with the trust's terms.

To exercise your right to withdraw, please contact ${data.trusteeName} at ${data.trusteeEmail}${data.trusteePhone ? ` or ${data.trusteePhone}` : ''} no later than ${data.withdrawalDeadline}.

This notice is provided as a requirement under the trust agreement and tax regulations. It is not intended to encourage or discourage you from withdrawing the funds. If you have questions or need further clarification, please consult your personal attorney or advisor.

Sincerely,

${data.trusteeName}, Trustee
${data.trusteeAddress}
${data.trusteeEmail}
${data.trusteePhone || ''}

---

BENEFICIARY ACKNOWLEDGMENT

Please acknowledge receipt of this notice by visiting:
${data.acknowledgmentUrl}

This acknowledgment confirms you received notice of your withdrawal rights and does not affect your ability to exercise or waive those rights.
  `.trim();
}

export async function sendReminderEmail(data: NoticeEmailData & { daysRemaining: number }): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Reminder: Withdrawal Right Expires in ${data.daysRemaining} Days - ${data.trustName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .ack-button { display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="alert">
    <strong>Reminder:</strong> Your withdrawal right for $${data.withdrawalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} from ${data.trustName} expires on ${data.withdrawalDeadline}.
  </div>

  <p>Dear ${data.beneficiaryName.split(' ')[0]},</p>

  <p>This is a reminder that you have <strong>${data.daysRemaining} days</strong> remaining to exercise your right to withdraw funds from the trust contribution made on ${data.contributionDate}.</p>

  <p>If you have not already acknowledged receipt of the original notice, please do so now:</p>

  <p><a href="${data.acknowledgmentUrl}" class="ack-button">Acknowledge Receipt</a></p>

  <p>If you have questions about exercising your withdrawal right, contact ${data.trusteeName} at ${data.trusteeEmail}.</p>
</body>
</html>
  `.trim();

  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: data.beneficiaryName,
      subject,
      html,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

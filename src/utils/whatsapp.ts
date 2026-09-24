/**
 * WhatsApp Helper Utilities for Prince Limousine & Car Rental Fleet ERP
 */

export function formatQatarPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  // Remove spaces, dashes, brackets, plus signs
  let cleaned = rawPhone.replace(/[\s\-\(\)\+]/g, '');

  // If local 8-digit Qatar mobile (starts with 3, 5, 6, 7), prepend 974
  if (/^[3567]\d{7}$/.test(cleaned)) {
    cleaned = `974${cleaned}`;
  }
  // If starts with 00, strip leading 00
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

export function createWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatQatarPhone(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(phone: string, message: string): void {
  const link = createWhatsAppLink(phone, message);
  if (link) {
    const a = document.createElement('a');
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export const WhatsAppTemplates = {
  generalContact: (driverName: string) =>
    `Hello ${driverName}, this is Prince Limousine & Car Rental Fleet Management. How may we assist you today?`,

  generalDriverMessage: (driverName: string) =>
    `Hello ${driverName}, this is Prince Limousine & Car Rental Fleet Management. How may we assist you today?`,

  paymentReminder: (
    driverName: string,
    amountDue: number,
    dueDate?: string
  ) =>
    `Hello ${driverName},\nThis is Prince Limousine & Car Rental Fleet Management.\n\n⚠️ Payment Reminder: Your current rental balance due is QAR ${amountDue.toLocaleString()}${
      dueDate ? ` (as of ${dueDate})` : ''
    }.\n\nPlease arrange for settlement at our office or via bank transfer at your earliest convenience. Thank you!`,

  documentExpiryWarning: (
    driverName: string,
    docType: string,
    docNumber: string,
    expiryDate: string,
    daysRemaining: number
  ) =>
    `Hello ${driverName},\nThis is Prince Limousine & Car Rental Fleet Management.\n\n⚠️ Friendly Reminder: Your ${docType}${
      docNumber ? ` (No. ${docNumber})` : ''
    } is expiring on ${expiryDate} (${daysRemaining} days remaining).\n\nPlease proceed with renewal and provide the updated document copy to our office at your earliest convenience. Thank you!`,

  documentExpiredAlert: (
    driverName: string,
    docType: string,
    docNumber: string,
    expiryDate: string
  ) =>
    `URGENT NOTICE:\nHello ${driverName},\nThis is Prince Limousine & Car Rental Fleet Management.\n\n🚨 Your ${docType}${
      docNumber ? ` (No. ${docNumber})` : ''
    } expired on ${expiryDate}.\n\nPlease contact our fleet operations office immediately to submit your renewed document to maintain your active driving status.`,

  financingInstallment: (
    driverName: string,
    vehiclePlate: string,
    installmentNo: number,
    amount: number,
    dueDate: string,
    remaining: number
  ) =>
    `Hello ${driverName},\nThis is Prince Limousine & Car Rental Fleet Management.\n\n🚗 Financing Installment Notice for Vehicle [${vehiclePlate}]:\n• Installment: #${installmentNo}\n• Due Amount: QAR ${amount.toLocaleString()}\n• Due Date: ${dueDate}\n• Outstanding Balance: QAR ${remaining.toLocaleString()}\n\nPlease ensure timely payment at our counter or via bank transfer. Thank you!`,
};

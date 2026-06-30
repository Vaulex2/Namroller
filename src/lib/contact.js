/* Single source of truth for NamRoller contact channels.
 * Imported by the Contact page, the floating ContactDock, and product pages so
 * the phone number / Telegram handle only ever live in one place. */

export const PHONE = '+998 97 374 77 55';
export const PHONE_HREF = 'tel:+998973747755';

export const EMAIL = 'sales@namroller.uz';
export const EMAIL_HREF = `mailto:${EMAIL}`;

// Telegram sales contact (a human account or public channel — NOT the
// notification bot). Replace with the real @username.
// TODO(namroller): set this to your actual Telegram handle.
export const TELEGRAM_USERNAME = 'namroller';
export const TELEGRAM_HREF = `https://t.me/${TELEGRAM_USERNAME}`;

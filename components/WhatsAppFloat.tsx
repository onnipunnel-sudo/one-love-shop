// Floating WhatsApp chat button — opens the owner's WhatsApp chat.

import { SHOP_WHATSAPP } from '@/lib/store';

export function WhatsAppFloat() {
  const href = `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(
    'Hi ONE LOVE! I have a question about your products.'
  )}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-black/40 transition-transform hover:scale-110"
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8 fill-white" aria-hidden="true">
        <path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 1.9 6.5L4 29l7.7-1.8c1.8 1 3.9 1.6 6.1 1.6h.2c6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.6 1.1 1.1-4.5-.3-.4c-1.1-1.7-1.7-3.7-1.7-5.8C6.8 9.9 10.4 7 16 7s9.2 4.2 9.2 9.3-4.2 8.5-9.2 8.5zm5.1-6.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.2-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
      </svg>
    </a>
  );
}

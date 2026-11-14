/** Contact link helpers. They return "" when the hotel has not entered the detail yet, so callers can hide the control. */
export const whatsappHref = (number: string, message: string) =>
  /^\d{7,15}$/.test(number) ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : "";
export const telHref = (phone: string) => (phone.trim() ? `tel:${phone.replace(/[^\d+]/g, "")}` : "");
export const mailHref = (email: string) => (email.trim() ? `mailto:${email.trim()}` : "");
/** Only Google Maps embed URLs are ever put in an iframe. */
export const isGoogleEmbed = (url: string) => /^https:\/\/(www\.)?google\.com\/maps\/embed/i.test(url);

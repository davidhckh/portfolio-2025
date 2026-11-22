import { t } from "../i18n/utils/translate";

// "Get in touch" opens a WhatsApp chat with a greeting already typed, in the
// visitor's language. Number in international format, digits only.
export const WHATSAPP_NUMBER = "51942890820";

export const getWhatsAppUrl = () =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t("whatsapp-message"))}`;

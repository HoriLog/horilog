// src/services/whatsappService.ts

const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL as string | undefined;
const WHATSAPP_API_KEY = import.meta.env.VITE_WHATSAPP_API_KEY as string | undefined;

export interface WhatsAppPayload {
  phone:   string;
  message: string;
  sender?: string; // identificador do remetente, se a API suportar
}

export interface WhatsAppResult {
  success:    boolean;
  messageId?: string;
  error?:     string;
}

export async function sendWhatsAppMessage(
  payload: WhatsAppPayload
): Promise<WhatsAppResult> {
  if (!WHATSAPP_API_URL) {
    console.warn('[WhatsApp] VITE_WHATSAPP_API_URL não configurada — usando fallback web.');
    openWhatsAppWeb(payload.phone, payload.message);
    return { success: true, messageId: 'web-fallback' };
  }

  const phone = payload.phone.replace(/\D/g, '');

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (WHATSAPP_API_KEY) {
      headers['Authorization'] = `Bearer ${WHATSAPP_API_KEY}`;
    }

    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone, message: payload.message }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API retornou ${response.status}: ${text}`);
    }

    const data = await response.json();
    return { success: true, messageId: data.id ?? data.messageId ?? undefined };

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[WhatsApp] Falha no envio direto:', msg);

    // Fallback: abre WhatsApp Web se a API falhar
    openWhatsAppWeb(payload.phone, payload.message);
    return { success: false, error: msg };
  }
}

/** Disparo em lote para múltiplos contatos */
export async function sendWhatsAppBulk(
  contacts: { phone: string; name: string }[],
  message:  string,
  delayMs = 800  // intervalo entre disparos para evitar bloqueio
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0, failed = 0;
  const errors: string[] = [];

  for (const contact of contacts) {
    const result = await sendWhatsAppMessage({ phone: contact.phone, message });
    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${contact.name}: ${result.error}`);
    }
    if (delayMs > 0) await sleep(delayMs);
  }

  return { sent, failed, errors };
}

function openWhatsAppWeb(phone: string, message: string) {
  const clean   = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encoded}`, '_blank');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
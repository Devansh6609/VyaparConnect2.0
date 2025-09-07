// lib/whatsapp.ts
export async function sendWhatsAppMessage(to: string, text: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/whatsapp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        type: "text",
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("❌ Failed to send WhatsApp message:", err);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("❌ WhatsApp send error:", error);
    return null;
  }
}

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getIO } from "@/lib/socket";

const prisma = new PrismaClient();
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

// This helper function gets the actual public URL for a media item from Meta's servers.
async function getMediaUrl(mediaId: string): Promise<string | null> {
  if (!accessToken) {
    console.error("WhatsApp Access Token is missing. Cannot fetch media URL.");
    return null;
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      console.error("Failed to fetch media URL from Meta:", await res.json());
      return null;
    }
    const data = await res.json();
    return data.url || null;
  } catch (error) {
    console.error("Failed to fetch media URL from Meta:", error);
    return null;
  }
}

// Your GET function for webhook verification remains the same.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully!");
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error("❌ Webhook verification failed.");
    return new NextResponse(null, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📩 Incoming WhatsApp webhook:", JSON.stringify(body, null, 2));

    const messageData = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const contactData = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];

    if (!messageData || !contactData) {
      return new NextResponse(null, { status: 200 });
    }

    const fromPhone = messageData.from;
    const customerName = contactData.profile.name || "Unknown";
    const messageType = messageData.type;
    const incomingWamid = messageData.id;

    let messageText: string | null = null;
    let mediaUrl: string | null = null;
    let replyToText: string | null = null;

    switch (messageType) {
      case "text":
        messageText = messageData.text?.body || null;
        break;
      case "image":
        messageText = messageData.image?.caption || null;
        const imageId = messageData.image?.id;
        if (imageId) mediaUrl = await getMediaUrl(imageId);
        break;
      default:
        messageText = "Unsupported message type received";
    }

    const replyContext = messageData.context;
    if (replyContext && replyContext.id) {
      // ✅ THE FIX: Use `findFirst` instead of `findUnique`. This is more flexible
      // and allows us to search by the `wamid` field without crashing.
      const repliedToMessage = await prisma.message.findFirst({
        where: { wamid: replyContext.id },
      });
      replyToText = repliedToMessage?.text
        ? `"${repliedToMessage.text}"`
        : "an earlier message";
    }

    const contact = await prisma.contact.upsert({
      where: { phone: fromPhone },
      update: { name: customerName },
      create: {
        name: customerName,
        phone: fromPhone,
        user: { connect: { email: "demo@vyaparconnect.com" } },
      },
    });

    const savedMessage = await prisma.message.create({
      data: {
        from: fromPhone,
        to: "business",
        text: messageText,
        mediaUrl: mediaUrl,
        type: messageType,
        contactId: contact.id,
        replyToText: replyToText,
        wamid: incomingWamid,
      },
    });

    getIO()?.emit("newMessage", savedMessage);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return new NextResponse(null, { status: 200 });
  }
}

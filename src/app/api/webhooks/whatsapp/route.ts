// src/app/api/webhooks/whatsapp/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getIO } from "@/lib/socket";

const prisma = new PrismaClient();

// ✅ Webhook verification
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

// ✅ Incoming messages
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📩 Incoming WhatsApp webhook:", JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];
    const contacts = value?.contacts?.[0];

    if (!message || !contacts) {
      return NextResponse.json({
        status: "success",
        message: "Not a user message or incomplete data",
      });
    }

    const phone = contacts.wa_id;
    const profileName = contacts.profile?.name || "Unknown";

    // 1️⃣ Ensure user exists
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: profileName,
          phone,
          email: `${phone}@autouser.local`,
          password: "temp-password", // placeholder until auth system
        },
      });
      console.log(`✅ New user created for phone: ${phone}`);
    }

    // 2️⃣ Upsert contact
    const contact = await prisma.contact.upsert({
      where: { phone },
      update: {
        name: profileName,
        userId: user.id,
      },
      create: {
        name: profileName,
        phone,
        userId: user.id,
      },
    });

    // 3️⃣ Save incoming message
    const savedMessage = await prisma.message.create({
      data: {
        from: phone,
        to: "business",
        text: message.text?.body || null,
        type: message.type,
        mediaUrl:
          message.image?.link ||
          message.video?.link ||
          message.audio?.link ||
          message.document?.link ||
          null,
        contactId: contact.id,
      },
    });

    // 4️⃣ Increment unread count for this contact
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        unreadCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    // 5️⃣ Emit real-time event
    const io = getIO();
    if (io) {
      io.emit("newMessage", savedMessage);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

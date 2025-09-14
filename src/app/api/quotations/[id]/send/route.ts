// src/app/api/quotations/[id]/send/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Razorpay from "razorpay";
import { getIO } from "@/lib/socket";

const prisma = new PrismaClient();

const keyId = process.env.RAZORPAY_KEY_ID || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const quotationId = params.id;
  const baseUrl = new URL(req.url).origin;

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneId) {
    return NextResponse.json(
      { error: "Missing WhatsApp environment variables" },
      { status: 500 }
    );
  }

  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { contact: true },
    });

    if (!quotation || !quotation.contact) {
      return NextResponse.json(
        { error: "Quotation or associated contact not found" },
        { status: 404 }
      );
    }

    // 1️⃣ Fetch image from generate-image route
    const imageRes = await fetch(
      `${baseUrl}/api/quotations/${quotationId}/generate-image`
    );
    if (!imageRes.ok) {
      throw new Error("Failed to generate quotation image");
    }
    const imageBuffer = await imageRes.arrayBuffer();

    // 2️⃣ Upload to ImgBB (or Cloudinary if you prefer)
    const formData = new FormData();
    formData.append(
      "image",
      new Blob([imageBuffer], { type: "image/png" }),
      `quotation-${quotationId}.png`
    );

    const uploadRes = await fetch(
      `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`,
      {
        method: "POST",
        body: formData,
      }
    );
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok || !uploadData.data.url) {
      throw new Error("Image upload failed");
    }

    const imageUrl = uploadData.data.url;

    // 3️⃣ Create Razorpay payment link
    const paymentLink = await razorpay.paymentLink.create({
      amount: Math.round(quotation.total * 100),
      currency: "INR",
      description: `Payment for Quotation #${quotation.id}`,
      customer: {
        name: quotation.customerName,
        contact: quotation.contactNumber,
      },
      notify: { sms: true, email: false },
      reminder_enable: true,
    });

    // 4️⃣ Save message in DB
    const savedMessage = await prisma.message.create({
      data: {
        from: "business",
        to: quotation.contact.phone,
        type: "image",
        text: `Quotation #${quotation.id}`,
        mediaUrl: imageUrl,
        contactId: quotation.contact.id,
      },
    });

    getIO()?.emit("newMessage", savedMessage);

    // 5️⃣ Send image to WhatsApp
    await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: quotation.contact.phone,
        type: "image",
        image: { link: imageUrl },
      }),
    });

    // 6️⃣ Send payment link as separate text message
    await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: quotation.contact.phone,
        type: "text",
        text: { body: `You can pay securely here: ${paymentLink.short_url}` },
      }),
    });

    return NextResponse.json({ success: true, imageUrl, paymentLink });
  } catch (error: any) {
    console.error("❌ Send quotation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send quotation" },
      { status: 500 }
    );
  }
}

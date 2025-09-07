import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const TOKEN = process.env.WHATSAPP_TOKEN!;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const GRAPH = `https://graph.facebook.com/v15.0`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // body: { to: "+91xxxx", type: "text"|"document", text?: string, documentUrl?: string, filename?: string, caption?: string }
    const { to, type = "text", text, documentUrl, filename, caption } = body;
    if (!to) return NextResponse.json({ error: "missing `to`" }, { status: 400 });

    if (type === "text") {
      const payload = {
        messaging_product: "whatsapp",
        to,
        text: { body: text },
      };
      const r = await fetch(`${GRAPH}/${PHONE_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await r.json();

      // Save message to DB
      const contact = (await prisma.contact.findUnique({ where: { phone: to } }))
        || (await prisma.contact.create({ data: { phone: to, name: to, userId: (await prisma.user.findFirst())!.id } }));

      await prisma.message.create({
        data: {
          from: "business",
          to,
          text,
          mediaUrl: null,
          type: "text",
          contactId: contact.id,
        },
      });

      return NextResponse.json(json);
    }

    if (type === "document" && documentUrl) {
      // Preferred: upload document to media endpoint, then send using media id
      // 1) Upload
      const uploadRes = await fetch(`${GRAPH}/${PHONE_ID}/media`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messaging_product: "whatsapp", file: documentUrl }), // note: some setups accept url, otherwise upload binary
      });
      const uploadJson = await uploadRes.json();
      const mediaId = uploadJson.id;

      // 2) Send document message
      const payload = {
        messaging_product: "whatsapp",
        to,
        type: "document",
        document: { id: mediaId, filename: filename || "file.pdf", caption: caption || "" },
      };
      const sendRes = await fetch(`${GRAPH}/${PHONE_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const sendJson = await sendRes.json();

      // Save to DB
      const contact = (await prisma.contact.findUnique({ where: { phone: to } }))
        || (await prisma.contact.create({ data: { phone: to, name: to, userId: (await prisma.user.findFirst())!.id } }));

      await prisma.message.create({
        data: {
          from: "business",
          to,
          text: caption || null,
          mediaUrl: documentUrl,
          type: "document",
          contactId: contact.id,
        },
      });

      return NextResponse.json(sendJson);
    }

    return NextResponse.json({ error: "unsupported type" }, { status: 400 });
  } catch (err) {
    console.error("Send message error:", err);
    return NextResponse.json({ error: "failed to send" }, { status: 500 });
  }
}

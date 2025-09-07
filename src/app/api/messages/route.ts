import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getIO } from "@/lib/socket";

const prisma = new PrismaClient();

// GET /api/messages?contactId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId is required" },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { contactId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error("GET /api/messages error:", err);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages
export async function POST(req: Request) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneId) {
    console.error("❌ Missing WhatsApp environment variables");
    return NextResponse.json(
      { error: "Server configuration error. Cannot send message." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { contactId, text, mediaUrl, type = "text" } = body;

    if (!contactId || (!text && !mediaUrl)) {
      return NextResponse.json(
        { error: "contactId and text or mediaUrl are required" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Call WhatsApp API
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken.trim()}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: contact.phone,
          ...(type === "text"
            ? { type: "text", text: { body: text } }
            : { type: "image", image: { link: mediaUrl } }),
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ WhatsApp API error:", errorText);
      return NextResponse.json(
        {
          error: "Failed to send message via WhatsApp",
          apiResponse: JSON.parse(errorText),
        },
        { status: 502 }
      );
    }

    // Save message in DB
    const message = await prisma.message.create({
      data: {
        from: "business",
        to: contact.phone,
        text,
        mediaUrl,
        type,
        contactId,
      },
    });

    // Emit real-time event
    try {
      const io = getIO();
      if (io) {
          io.emit("newMessage", message); // ✅ broadcast to all clients
        }
    } catch (e) {
      console.error("Socket emit failed:", e);
    }

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("POST /api/messages error:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}









// import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// // GET /api/messages?contactId=xxx
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const contactId = searchParams.get("contactId");

//     if (!contactId) {
//       return NextResponse.json(
//         { error: "contactId is required" },
//         { status: 400 }
//       );
//     }

//     const messages = await prisma.message.findMany({
//       where: { contactId },
//       orderBy: { createdAt: "asc" },
//     });

//     return NextResponse.json(messages);
//   } catch (err) {
//     console.error("GET /api/messages error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch messages" },
//       { status: 500 }
//     );
//   }
// }

// // POST /api/messages
// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { contactId, text, mediaUrl, type = "text" } = body;

//     if (!contactId || (!text && !mediaUrl)) {
//       return NextResponse.json(
//         { error: "contactId and text or mediaUrl are required" },
//         { status: 400 }
//       );
//     }

//     // ✅ Get the contact to know their phone
//     const contact = await prisma.contact.findUnique({
//       where: { id: contactId },
//     });

//     if (!contact) {
//       return NextResponse.json(
//         { error: "Contact not found" },
//         { status: 404 }
//       );
//     }

//     // ✅ Save message in DB
//     const message = await prisma.message.create({
//       data: {
//         from: "business",
//         to: contact.phone,
//         text,
//         mediaUrl,
//         type,
//         contactId,
//       },
//     });

//     // ✅ Send message to WhatsApp API
//     const res = await fetch(
//       `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN?.trim()}`,
//         },
//         body: JSON.stringify({
//           messaging_product: "whatsapp",
//           to: contact.phone,
//           ...(type === "text"
//             ? { type: "text", text: { body: text } }
//             : { type: "image", image: { link: mediaUrl } }),
//         }),
//       }
//     );

//     if (!res.ok) {
//       console.error("❌ WhatsApp API error:", await res.text());
//     }

//     return NextResponse.json(message, { status: 201 });
//   } catch (err) {
//     console.error("POST /api/messages error:", err);
//     return NextResponse.json(
//       { error: "Failed to send message" },
//       { status: 500 }
//     );
//   }
// }

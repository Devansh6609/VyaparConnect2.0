import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const rawBody = await req.text(); // Get raw request body
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // ✅ Verify signature
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // Handle only payment events
    if (event.event === "payment.captured" || event.event === "payment.failed") {
      const paymentId = event.payload.payment.entity.id;
      const orderId = event.payload.payment.entity.order_id;
      const status = event.event === "payment.captured" ? "PAID" : "FAILED";

      // ✅ Update DB
      const payment = await prisma.payment.updateMany({
        where: { razorpayOrderId: orderId },
        data: {
          razorpayPaymentId: paymentId,
          status,
        },
      });

      // Find quotation linked
      const linked = await prisma.payment.findFirst({
        where: { razorpayOrderId: orderId },
        include: { quotation: { include: { contact: true } } },
      });

      if (linked?.quotation && linked.quotation.contact) {
        const contact = linked.quotation.contact;

        // Save chat message
        await prisma.message.create({
          data: {
            from: "business",
            to: contact.phone,
            type: "text",
            text:
              status === "PAID"
                ? `✅ Payment received for Quotation #${linked.quotation.id}. Thank you!`
                : `❌ Payment failed for Quotation #${linked.quotation.id}. Please try again.`,
            contactId: contact.id,
          },
        });

        // (Optional) emit socket event here so UI updates instantly
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Razorpay webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

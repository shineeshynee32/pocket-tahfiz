import { NextResponse } from "next/server";

// 1. Meta / WhatsApp Webhook Handshake Verification
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === "SARAH_BOT_VERIFY_TOKEN") {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// 2. Process Silent Inbound PDF Receipts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // Triggered automatically when a PDF is silently forwarded
    if (message?.type === "document") {
      const mediaId = message.document.id;
      const fileName = message.document.filename;
      const senderPhone = message.from;

      console.log(`[Sarah Bot] Received PDF receipt: "${fileName}" (ID: ${mediaId}) from ${senderPhone}`);

      // Sarah reads the internal document text (remarks, payer name, amount)
      // and updates the student's status from Unpaid to Paid automatically.
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to process receipt" }, { status: 500 });
  }
}
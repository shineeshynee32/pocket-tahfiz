import "dotenv/config";
import { Bot, InlineKeyboard } from "grammy";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8688425101:AAGTiDVAJLXsEAcX51Ngr7NVS7aGncAgNCU";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "AQ.Ab8RN6IgikXIXli1EY06aw29mrfy0m-lQvTDgoNJ9iaLX1XBVA";

const bot = new Bot(BOT_TOKEN);
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

bot.on("message:document", async (ctx) => {
  try {
    const doc = ctx.message.document;
    if (!doc.file_name?.toLowerCase().endsWith(".pdf")) {
      return ctx.reply("Please forward a valid PDF receipt.");
    }

    await ctx.reply(`📄 Analyzing receipt with Gemini Vision...`);

    // 1. Fetch PDF and convert to Base64
    const file = await ctx.getFile();
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const response = await fetch(fileUrl);
    const pdfBase64 = Buffer.from(await response.arrayBuffer()).toString("base64");

    // 2. Parse PDF directly using Gemini Vision
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBase64,
          },
        },
        "Extract the payment amount (number only) and the sender/payer name from this bank receipt. Return JSON only in this format: {\"amount\": 100.00, \"payerName\": \"MOHD DANIAL\"}",
      ],
    });

    const rawText = aiResponse.text?.replace(/```json|```/g, "").trim() || "{}";
    const parsed = JSON.parse(rawText);
    const payerName = parsed.payerName || "Bank Transfer Account";
    const amount = parsed.amount ? parseFloat(parsed.amount) : null;

    if (supabase) {
      // Check for remembered parent name first
      const { data: rememberedByPayer } = await supabase
        .from("students")
        .select("*")
        .ilike("parent_bank_name", `%${payerName}%`);

      if (rememberedByPayer && rememberedByPayer.length > 0 && payerName !== "Bank Transfer Account") {
        const student = rememberedByPayer[0];
        await markStudentPaid(student.id);
        return ctx.reply(
          `✅ **Automatic Match (Remembered Payer)!**\n\n**Student**: ${student.name}\n**Amount**: ${amount ? `RM ${amount.toFixed(2)}` : "Detected"}\n**Payer**: ${payerName}\n\nUpdated status to **PAID** on dashboard!`, 
          { parse_mode: "Markdown" }
        );
      }

      // Interactive selection buttons fallback
      const { data: allStudents } = await supabase.from("students").select("id, name, monthly_fee");
      
      const keyboard = new InlineKeyboard();
      allStudents?.forEach((s, idx) => {
        keyboard.text(`${s.name} (RM ${s.monthly_fee || '100'})`, `assign_${s.id}_${amount || 0}_${encodeURIComponent(payerName)}`);
        if ((idx + 1) % 2 === 0) keyboard.row();
      });

      return ctx.reply(
        `📄 **Receipt Analyzed ${amount ? `: RM ${amount.toFixed(2)}` : ""}**\n**Payer**: ${payerName}\n\n*Tap the student to mark as PAID:*`,
        { parse_mode: "Markdown", reply_markup: keyboard }
      );
    }

    return ctx.reply(`📄 **Parsed Receipt**\n• Payer: ${payerName}\n• Amount: ${amount ? `RM ${amount.toFixed(2)}` : "Not detected"}`);
  } catch (err: any) {
    console.error("[Bot Processing Error]:", err);
    ctx.reply(`❌ Gemini Read Error: ${err.message || "Could not read receipt."}`);
  }
});

bot.callbackQuery(/^assign_(.+)_(.+)_(.+)$/, async (ctx) => {
  const [, studentId, amountStr, encodedPayerName] = ctx.match;
  const payerName = decodeURIComponent(encodedPayerName);

  if (supabase) {
    try {
      await supabase
        .from("students")
        .update({ 
          paymentStatus: "Paid", 
          paymentDate: new Date().toISOString().split("T")[0],
          parent_bank_name: payerName 
        })
        .eq("id", studentId);

      await ctx.answerCallbackQuery("Assigned & Saved!");
      await ctx.editMessageText(`✅ **Assigned & Saved!**\n\nMarked student as **PAID**. Saved **"${payerName}"**—future receipts from this account will approve automatically!`, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("[Callback Error]:", err);
    }
  }
});

async function markStudentPaid(studentId: string) {
  if (!supabase) return;
  await supabase
    .from("students")
    .update({ 
      paymentStatus: "Paid", 
      paymentDate: new Date().toISOString().split("T")[0] 
    })
    .eq("id", studentId);
}

async function startBot() {
  try {
    await bot.init();
    console.log(`🤖 Sarah Telegram Bot (@${bot.botInfo.username}) is connected and online with Gemini Vision!`);
    await bot.start();
  } catch (err: any) {
    console.error("❌ Connection Failed:", err.message);
  }
}

startBot();
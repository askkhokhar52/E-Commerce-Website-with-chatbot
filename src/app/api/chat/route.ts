import { NextResponse } from "next/server";
import { getProductsFromSheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

interface Message {
  role: "user" | "model";
  text: string;
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    // 1. Fetch live product data from Google Sheet
    const sheetProducts = await getProductsFromSheet();

    // 2. Format inventory context from Google Sheet
    const inventoryContext =
      sheetProducts.length > 0
        ? sheetProducts
            .map(
              (p, i) =>
                `${i + 1}. Product: ${p.title}\n   Category: ${p.category}\n   Price: $${p.price}\n   Stock Status: ${p.stockStatus}\n   Description: ${p.description || "N/A"}`
            )
            .join("\n\n")
        : "Inventory data is currently unavailable from Google Sheets.";

    // 3. System Instruction
    const systemPrompt = `You are the friendly, knowledgeable AI Sales & Customer Support Assistant for "Shop.co", a modern fashion e-commerce store.

YOUR OBJECTIVE:
- Help customers discover products, check prices, verify stock availability, and make fashion recommendations.
- Keep your answers concise, engaging, polite, and well-formatted with bullet points and emojis where appropriate.

REAL-TIME INVENTORY (SOURCED DIRECTLY FROM THE STORE'S GOOGLE SHEET):
${inventoryContext}

RULES:
1. Always base product availability, prices, categories, and stock statuses STRICTLY on the Google Sheet inventory provided above.
2. If an item is listed as "Out of Stock" (e.g., Blue Jeans), clearly let the customer know that it is currently out of stock, and politely recommend available alternatives (e.g., Faded Skinny Jeans).
3. If an item is "In Stock", confirm its price and share a brief highlight from its description.
4. If a customer asks about items not present in the inventory, politely explain that Shop.co does not currently stock that item, but offer to help with our available Jeans and Shirts.
5. Provide helpful advice if customers ask for outfit ideas or sizing suggestions.`;

    // 4. Build contents array for Gemini
    const contents: Array<{
      role: "user" | "model";
      parts: Array<{ text: string }>;
    }> = [];

    // Add prior conversation history (if any)
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.text && (item.role === "user" || item.role === "model")) {
          contents.push({
            role: item.role,
            parts: [{ text: item.text }],
          });
        }
      }
    }

    // Append latest user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // 5. Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        },
      }),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", data);
      return NextResponse.json(
        {
          error:
            data.error?.message || "Failed to generate response from Gemini API.",
        },
        { status: geminiResponse.status }
      );
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't formulate a response right now. Please try again.";

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}


import { google } from "googleapis";
import path from "path";
import { Product } from "@/types/product.types";

const SPREADSHEET_ID =
  process.env.GOOGLE_SHEET_ID || "1THGzUNUue3UrvxAcLiuOIIaZNs7XrttE45R4YHJO7zI";

function getAuth() {
  // Option 1: Direct JSON string in environment variable (Ideal for Vercel / Cloud)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
      return new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
    } catch (e) {
      console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_CREDENTIALS:", e);
    }
  }

  // Option 2: Individual email and private key env variables
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }

  // Option 3: Local JSON key file
  const keyFileName =
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ||
    "shopco-sales-assistant-3bb61f4d66d3.json";
  const keyFilePath = path.isAbsolute(keyFileName)
    ? keyFileName
    : path.join(process.cwd(), keyFileName);

  return new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export type SheetProductItem = Product & {
  category: string;
  stockStatus: string;
  description: string;
};

export async function getProductsFromSheet(): Promise<SheetProductItem[]> {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A2:E50",
    });

    const rows = response.data.values || [];

    return rows
      .filter((row) => row && row[0])
      .map((row, index) => {
        const title = (row[0] || "").trim();
        const category = (row[1] || "").trim();
        const priceNum = parseFloat(row[2]) || 0;
        const stockStatus = (row[3] || "").trim();
        const description = (row[4] || "").trim();

        let srcUrl = `/images/pic${(index % 8) + 1}.png`;
        const lower = title.toLowerCase();
        if (lower.includes("faded")) {
          srcUrl = "/images/pic8.png";
        } else if (lower.includes("blue jeans")) {
          srcUrl = "/images/pic2.png";
        } else if (lower.includes("striped")) {
          srcUrl = "/images/pic5.png";
        } else if (lower.includes("formal")) {
          srcUrl = "/images/pic3.png";
        } else if (lower.includes("t-shirt")) {
          srcUrl = "/images/pic1.png";
        }

        return {
          id: 100 + index + 1,
          title,
          category,
          price: priceNum,
          stockStatus,
          description,
          srcUrl,
          gallery: [srcUrl],
          discount: {
            amount: 0,
            percentage: 0,
          },
          rating: 4.5,
        };
      });
  } catch (error) {
    console.error("Error fetching products from Google Sheet:", error);
    return [];
  }
}


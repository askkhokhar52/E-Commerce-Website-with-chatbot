import { NextResponse } from "next/server";
import { getProductsFromSheet } from "@/lib/googleSheets";

// Revalidate every 60 seconds or dynamic
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getProductsFromSheet();
    return NextResponse.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch products from Google Sheet",
      },
      { status: 500 }
    );
  }
}


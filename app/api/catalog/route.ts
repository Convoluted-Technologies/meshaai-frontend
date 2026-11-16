import { NextRequest, NextResponse } from "next/server";
import { backendFetch, adaptCatalog } from "@/lib/backend";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedCurrency = searchParams.get("currency") || "";
    const path = requestedCurrency ? `/catalog?currency=${requestedCurrency}` : "/catalog";

    // Forward geo-IP headers if present (Cloudflare CDN headers)
    const extraHeaders: Record<string, string> = {};
    const cfCountry = req.headers.get("CF-IPCountry");
    const xCountry = req.headers.get("X-Country-Code");
    if (cfCountry) extraHeaders["CF-IPCountry"] = cfCountry;
    if (xCountry) extraHeaders["X-Country-Code"] = xCountry;

    const res = await backendFetch(path, { method: "GET" }, extraHeaders);
    const raw = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          detail: raw?.message || raw?.detail || "Failed to load catalog",
        },
        { status: res.status },
      );
    }

    const { presets, currency } = adaptCatalog(raw);
    return NextResponse.json({ success: true, presets, currency, count: presets.length });
  } catch (err: any) {
    console.error("[catalog] error:", err);
    return NextResponse.json(
      { success: false, detail: "Failed to load catalog from backend" },
      { status: 502 },
    );
  }
}

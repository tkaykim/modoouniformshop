import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [body];

    const mapped = rows.map((r: any) => {
      if (!r) throw new Error("Invalid payload");
      const product_id = r.product_id as string;
      const session_id = r.session_id as string | null;
      const user_id = (r.user_id as string | null) ?? null;
      const quantity = Number(r.quantity ?? 0);
      const unit_price = Number(r.unit_price ?? 0);
      const total_price = Number(r.total_price ?? unit_price * quantity);
      const selected_options = r.selected_options ?? null;
      if (!product_id || (!session_id && !user_id)) {
        throw new Error("Missing product_id or session/user context");
      }
      if (quantity <= 0 || unit_price < 0) {
        throw new Error("Invalid quantity or price");
      }
      return { product_id, session_id, user_id, quantity, unit_price, total_price, selected_options };
    });

    const { error } = await supabase.from("cart_items").insert(mapped);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}



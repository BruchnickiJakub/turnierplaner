import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token: raw } = await context.params;
  const token = String(raw ?? "").trim();
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ error: "Ungültiger Link." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("spectator_get_data", {
    p_token: token,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  if (data == null) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(data);
}

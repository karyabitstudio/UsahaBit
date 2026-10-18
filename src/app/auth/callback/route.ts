import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user) {
        const metadata = data.user.user_metadata ?? {};
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: data.user.email,
            full_name:
              typeof metadata.full_name === "string"
                ? metadata.full_name
                : null,
            business_name:
              typeof metadata.business_name === "string"
                ? metadata.business_name
                : null,
          },
          { onConflict: "id", ignoreDuplicates: true },
        );

        if (profileError) {
          console.error("Failed to create profile after auth callback:", profileError);
          return NextResponse.redirect(`${origin}/dashboard?warning=profile`);
        }

      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

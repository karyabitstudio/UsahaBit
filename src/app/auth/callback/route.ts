import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

        if (data.user.email) {
          const admin = createAdminClient();
          const { data: pendingInvite } = await admin
            .from("workspace_members")
            .select("id")
            .ilike("invited_email", data.user.email.toLowerCase())
            .eq("status", "pending")
            .limit(1)
            .maybeSingle();
          if (pendingInvite) {
            await admin.from("workspace_members").update({ member_user_id: data.user.id, status: "active" }).eq("id", pendingInvite.id);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

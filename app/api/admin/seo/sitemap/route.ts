import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin";

export async function POST() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    revalidatePath("/sitemap.xml", "page");
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not regenerate the sitemap." },
      { status: 500 },
    );
  }
}
import { NextResponse } from "next/server";
import { parseDexaPdf } from "@/lib/parse-pdf";

export async function POST(req: Request) {
  const formData = await req.formData();
  const memberId = String(formData.get("memberId") ?? "");
  const uploadId = String(formData.get("uploadId") ?? "");
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const parsed = await parseDexaPdf(bytes);

  return NextResponse.json({
    ok: true,
    memberId,
    uploadId,
    parsed: {
      ...parsed,
      scanDate: parsed.scanDate.toISOString(),
    },
  });
}

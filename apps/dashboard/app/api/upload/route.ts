import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseDexaPdf } from "@/lib/parse-pdf";

function toSafeNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toOptionalNumber(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export async function POST(req: Request) {
  let uploadId: string | null = null;

  try {
    const formData = await req.formData();
    const memberId = String(formData.get("memberId") || "");
    const file = formData.get("file") as File | null;

    if (!memberId || !file) {
      return NextResponse.json({ message: "Missing memberId or file" }, { status: 400 });
    }

    const upload = await prisma.uploadedFile.create({
      data: { memberId, fileName: file.name, fileUrl: "", parseStatus: "PENDING" },
    });
    uploadId = upload.id;

    const latestScan = await prisma.scan.findFirst({
      where: { memberId },
      orderBy: { scanDate: "desc" },
    });

    const fallback = {
      weightKg: latestScan?.weightKg ?? 70,
      bodyFatPercent: latestScan?.bodyFatPercent ?? 20,
      fatMassKg: latestScan?.fatMassKg ?? 14,
      leanMassKg: latestScan?.leanMassKg ?? 56,
      visceralFatMassKg: latestScan?.visceralFatMassKg ?? undefined,
      boneMassKg: latestScan?.boneMassKg ?? undefined,
      bmrKcal: latestScan?.bmrKcal ?? undefined,
      trunkFatKg: latestScan?.trunkFatKg ?? undefined,
      trunkLeanMassKg: latestScan?.trunkLeanMassKg ?? undefined,
      androidFatPercent: latestScan?.androidFatPercent ?? undefined,
      gynoidFatPercent: latestScan?.gynoidFatPercent ?? undefined,
      scanDate: new Date(),
    };

    let finalData = { ...fallback };
    let parseStatus: "SUCCESS" | "FAILED" = "FAILED";
    let message = "Upload saved with fallback values.";

    try {
      const bytes = Buffer.from(await file.arrayBuffer());
      const parsed = await parseDexaPdf(bytes);

      finalData = {
        weightKg: toSafeNumber(parsed.weightKg, fallback.weightKg),
        bodyFatPercent: toSafeNumber(parsed.bodyFatPercent, fallback.bodyFatPercent),
        fatMassKg: toSafeNumber(parsed.fatMassKg, fallback.fatMassKg),
        leanMassKg: toSafeNumber(parsed.leanMassKg, fallback.leanMassKg),
        visceralFatMassKg: toOptionalNumber(parsed.visceralFatMassKg) ?? fallback.visceralFatMassKg,
        boneMassKg: toOptionalNumber(parsed.boneMassKg) ?? fallback.boneMassKg,
        bmrKcal: fallback.bmrKcal,
        trunkFatKg: toOptionalNumber(parsed.trunkFatKg) ?? fallback.trunkFatKg,
        trunkLeanMassKg: toOptionalNumber(parsed.trunkLeanMassKg) ?? fallback.trunkLeanMassKg,
        androidFatPercent: toOptionalNumber(parsed.androidFatPercent) ?? fallback.androidFatPercent,
        gynoidFatPercent: toOptionalNumber(parsed.gynoidFatPercent) ?? fallback.gynoidFatPercent,
        scanDate: parsed.scanDate ?? new Date(),
      };

      parseStatus = "SUCCESS";
      message = "Upload parsed successfully";
    } catch (err) {
      console.error("PARSE_ERROR", err);
      message = "Upload saved with fallback values. PDF parsing failed.";
    }

    await prisma.scan.create({
      data: {
        memberId,
        weightKg: finalData.weightKg,
        bodyFatPercent: finalData.bodyFatPercent,
        fatMassKg: finalData.fatMassKg,
        leanMassKg: finalData.leanMassKg,
        visceralFatMassKg: finalData.visceralFatMassKg,
        boneMassKg: finalData.boneMassKg,
        bmrKcal: finalData.bmrKcal !== undefined ? Math.round(finalData.bmrKcal) : undefined,
        trunkFatKg: finalData.trunkFatKg,
        trunkLeanMassKg: finalData.trunkLeanMassKg,
        androidFatPercent: finalData.androidFatPercent,
        gynoidFatPercent: finalData.gynoidFatPercent,
        scanDate: finalData.scanDate,
      },
    });

    await prisma.uploadedFile.update({
      where: { id: upload.id },
      data: { parseStatus },
    });

    return NextResponse.json({ message, usedFallback: parseStatus === "FAILED", values: finalData });
  } catch (error) {
    console.error("UPLOAD_ROUTE_ERROR", error);
    if (uploadId) {
      try {
        await prisma.uploadedFile.update({ where: { id: uploadId }, data: { parseStatus: "FAILED" } });
      } catch {}
    }
    return NextResponse.json({ message: "Unexpected upload error" }, { status: 500 });
  }
}

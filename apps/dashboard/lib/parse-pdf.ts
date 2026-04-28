import { extractWithGemini } from "@/lib/gemini";

const LB_TO_KG = 0.45359237;

function extractNumber(pattern: RegExp, text: string): number | null {
  const match = text.match(pattern);
  if (match) {
    const n = parseFloat(match[1]);
    if (!isNaN(n)) return n;
  }
  return null;
}

function extractDate(text: string): Date {
  const m1 = text.match(
    /(?:Scan\s*Date|Exam\s*Date|Date)\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})/i
  );
  if (m1) {
    const d = new Date(m1[1]);
    if (!isNaN(d.getTime())) return d;
  }

  const m2 = text.match(
    /(?:Scan\s*Date|Exam\s*Date|Date)\s*[:\-]?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i
  );
  if (m2) {
    const d = new Date(m2[1]);
    if (!isNaN(d.getTime())) return d;
  }

  const m3 = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (m3) {
    const d = new Date(m3[1]);
    if (!isNaN(d.getTime())) return d;
  }

  return new Date();
}

function parseWithRegex(text: string) {
  const weightLbMatch = text.match(/Weight\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*lb/i);
  let weightKg: number | null = weightLbMatch
    ? parseFloat(weightLbMatch[1]) * LB_TO_KG
    : extractNumber(/Weight\s*(?:\(kg\)|kg)?\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, text);

  let bodyFat = extractNumber(/Total\s*Body\s*%?\s*Fat\s*(\d+(?:\.\d+)?)/i, text);
  if (bodyFat === null)
    bodyFat = extractNumber(/Body\s*Fat\s*%?\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, text);

  const totalRow = text.match(
    /Body\s+Composition\s+Results[\s\S]*?\nTotal\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i
  );
  let fatMassKg: number | null = null;
  let leanMassKg: number | null = null;

  if (totalRow) {
    fatMassKg = parseFloat(totalRow[1]) * LB_TO_KG;
    leanMassKg = parseFloat(totalRow[2]) * LB_TO_KG;
    if (bodyFat === null) bodyFat = parseFloat(totalRow[4]);
    if (weightKg === null) weightKg = parseFloat(totalRow[3]) * LB_TO_KG;
  }

  if (fatMassKg === null)
    fatMassKg = extractNumber(/Fat\s*Mass\s*(?:\(kg\)|kg)?\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, text);
  if (leanMassKg === null) {
    leanMassKg = extractNumber(/Lean\s*Mass\s*(?:\(kg\)|kg)?\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, text);
    if (leanMassKg === null)
      leanMassKg = extractNumber(/Lean\s*Tissue\s*(?:\(kg\)|kg)?\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, text);
  }

  const trunkRow = text.match(
    /Body\s+Composition\s+Results[\s\S]*?\nTrunk\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i
  );
  const trunkFatKg = trunkRow ? parseFloat(trunkRow[1]) * LB_TO_KG : null;
  const trunkLeanMassKg = trunkRow ? parseFloat(trunkRow[2]) * LB_TO_KG : null;

  const bmcMatch = text.match(
    /\nTotal\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s*$/m
  );
  const boneMassKg = bmcMatch ? parseFloat(bmcMatch[1]) / 1000 : null;

  const vatMatch = text.match(/Est\.\s*VAT\s*Mass\s*\(g\)\s*(\d+(?:\.\d+)?)/i);
  const visceralFatMassKg = vatMatch ? parseFloat(vatMatch[1]) / 1000 : null;

  const androidFatPercent = extractNumber(
    /Android\s*\(A\)\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)/i,
    text
  );
  const gynoidFatPercent = extractNumber(
    /Gynoid\s*\(G\)\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)/i,
    text
  );

  return {
    weightKg,
    bodyFatPercent: bodyFat,
    fatMassKg,
    leanMassKg,
    visceralFatMassKg,
    boneMassKg,
    trunkFatKg,
    trunkLeanMassKg,
    androidFatPercent,
    gynoidFatPercent,
    scanDate: extractDate(text),
  };
}

export interface ParsedScan {
  weightKg: number;
  bodyFatPercent: number;
  fatMassKg: number;
  leanMassKg: number;
  visceralFatMassKg: number | null;
  boneMassKg: number | null;
  trunkFatKg: number | null;
  trunkLeanMassKg: number | null;
  androidFatPercent: number | null;
  gynoidFatPercent: number | null;
  scanDate: Date;
}

export async function parseDexaPdf(fileBytes: Buffer): Promise<ParsedScan> {
  let fullText = "";
  try {
    // dynamic require avoids edge-runtime issues with pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(fileBytes);
    fullText = data.text ?? "";
  } catch {
    fullText = "";
  }

  const result = parseWithRegex(fullText) as Record<string, unknown>;

  const geminiResult = await extractWithGemini(fullText);
  for (const [key, value] of Object.entries(geminiResult)) {
    if (result[key] == null) result[key] = value;
  }

  const toNum = (v: unknown, fallback = 0) => {
    const n = parseFloat(String(v ?? ""));
    return isFinite(n) ? n : fallback;
  };
  const toOptNum = (v: unknown) => {
    const n = parseFloat(String(v ?? ""));
    return isFinite(n) ? n : null;
  };

  return {
    weightKg: toNum(result.weightKg),
    bodyFatPercent: toNum(result.bodyFatPercent),
    fatMassKg: toNum(result.fatMassKg),
    leanMassKg: toNum(result.leanMassKg),
    visceralFatMassKg: toOptNum(result.visceralFatMassKg),
    boneMassKg: toOptNum(result.boneMassKg),
    trunkFatKg: toOptNum(result.trunkFatKg),
    trunkLeanMassKg: toOptNum(result.trunkLeanMassKg),
    androidFatPercent: toOptNum(result.androidFatPercent),
    gynoidFatPercent: toOptNum(result.gynoidFatPercent),
    scanDate: result.scanDate instanceof Date ? result.scanDate : new Date(),
  };
}

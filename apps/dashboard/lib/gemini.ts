const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function formatWithGemini(question: string, rawAnswer: string): Promise<string> {
  if (!GEMINI_API_KEY) return rawAnswer;

  const prompt = `You are a fitness analytics assistant.

User question:
${question}

Database answer:
${rawAnswer}

Rewrite the answer in a clear, professional, human-friendly way.
Keep it short (2-3 lines max).
Do NOT add any new information.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(20000),
      }
    );
    if (!res.ok) return rawAnswer;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? rawAnswer;
  } catch {
    return rawAnswer;
  }
}

export async function extractWithGemini(text: string): Promise<Record<string, unknown>> {
  if (!GEMINI_API_KEY || !text.trim()) return {};

  const prompt = `Extract these DEXA values from the text and return ONLY valid JSON:

{
  "weightKg": number or null,
  "bodyFatPercent": number or null,
  "fatMassKg": number or null,
  "leanMassKg": number or null,
  "visceralFatMassKg": number or null,
  "boneMassKg": number or null,
  "trunkFatKg": number or null,
  "trunkLeanMassKg": number or null,
  "androidFatPercent": number or null,
  "gynoidFatPercent": number or null,
  "scanDate": "YYYY-MM-DD" or null
}

Rules:
- Return only JSON, no explanation
- If a field is missing use null

DEXA TEXT:
${text}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}") + 1;
    if (start === -1 || end === 0) return {};
    const parsed = JSON.parse(raw.slice(start, end));
    const result: Record<string, unknown> = {};
    for (const field of [
      "weightKg", "bodyFatPercent", "fatMassKg", "leanMassKg",
      "visceralFatMassKg", "boneMassKg", "trunkFatKg", "trunkLeanMassKg",
      "androidFatPercent", "gynoidFatPercent",
    ]) {
      if (parsed[field] != null) result[field] = parseFloat(parsed[field]);
    }
    if (parsed.scanDate) {
      const d = new Date(parsed.scanDate);
      if (!isNaN(d.getTime())) result.scanDate = d;
    }
    return result;
  } catch {
    return {};
  }
}

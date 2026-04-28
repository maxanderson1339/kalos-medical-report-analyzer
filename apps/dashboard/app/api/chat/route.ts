import { NextResponse } from "next/server";
import { answerFromSql } from "@/lib/query";
import { formatWithGemini } from "@/lib/gemini";

export async function POST(req: Request) {
  const { question } = await req.json();
  if (!question?.trim()) {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  const rawAnswer = await answerFromSql(question);
  let answer = rawAnswer;
  try {
    answer = await formatWithGemini(question, rawAnswer);
  } catch {}

  return NextResponse.json({ answer, raw: rawAnswer });
}

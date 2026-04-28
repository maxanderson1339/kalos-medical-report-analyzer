import { prisma } from "@/lib/db";

async function findMember(question: string) {
  const members = await prisma.member.findMany({
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  const q = question.toLowerCase();

  for (const m of members) {
    if (m.fullName && q.includes(m.fullName.toLowerCase())) return m;
  }
  for (const m of members) {
    if (m.fullName) {
      const firstName = m.fullName.split(" ")[0].toLowerCase();
      if (q.includes(firstName)) return m;
    }
  }
  return null;
}

function fmt(n: number, sign = false) {
  return (sign && n > 0 ? "+" : "") + n.toFixed(1);
}

export async function answerFromSql(question: string): Promise<string> {
  const q = question.toLowerCase().trim();
  const member = await findMember(q);
  const memberId = member?.id ?? null;

  if (q.includes("how many members") && (q.includes("3") || q.includes("three"))) {
    const members = await prisma.member.findMany({
      include: { _count: { select: { scans: true } } },
    });
    const count = members.filter((m) => m._count.scans >= 3).length;
    return `${count} members have had 3 or more scans.`;
  }

  if (q.includes("lost lean mass") || (q.includes("lean mass") && q.includes("lost"))) {
    const allMembers = await prisma.member.findMany({ select: { id: true } });
    const lost: string[] = [];
    for (const m of allMembers) {
      const scans = await prisma.scan.findMany({
        where: { memberId: m.id },
        include: { member: { select: { fullName: true } } },
        orderBy: { scanDate: "desc" },
        take: 2,
      });
      if (scans.length === 2 && scans[0].leanMassKg < scans[1].leanMassKg) {
        const decrease = scans[1].leanMassKg - scans[0].leanMassKg;
        lost.push(`${scans[0].member.fullName} (${decrease.toFixed(1)} kg decrease)`);
      }
    }
    if (lost.length === 0) return "No members have lost lean mass between their last two scans.";
    return `These members lost lean mass between their last two scans: ${lost.join(", ")}.`;
  }

  if (!memberId && ["body fat", "lean mass", "scan", "trend", "focus"].some((w) => q.includes(w))) {
    const members = await prisma.member.findMany({
      select: { fullName: true },
      orderBy: { fullName: "asc" },
    });
    const names = members.map((m) => m.fullName).join(", ");
    return `Please tell me which member you mean. Available members: ${names}.`;
  }

  if (!memberId) {
    return "I can answer questions about member scan data. Try asking about body fat trends, lean mass changes, scan counts, or coaching focus for a specific member.";
  }

  const scans = await prisma.scan.findMany({
    where: { memberId },
    include: { member: { select: { fullName: true } } },
    orderBy: { scanDate: "asc" },
  });

  if (scans.length === 0) return "I could not find scan data for that member.";

  const latest = scans[scans.length - 1];
  const previous = scans.length >= 2 ? scans[scans.length - 2] : null;
  const oldest = scans[0];
  const fullName = latest.member.fullName;
  const latestDate = latest.scanDate.toISOString().split("T")[0];

  if (q.includes("body fat") && ["today", "current", "latest", "now"].some((w) => q.includes(w))) {
    return `${fullName}'s latest body fat is ${latest.bodyFatPercent.toFixed(1)}% from the scan on ${latestDate}.`;
  }

  if (q.includes("body fat") && ["trend", "history", "progress"].some((w) => q.includes(w))) {
    if (scans.length === 1) return `${fullName} only has one scan so there is no trend yet. Current body fat: ${latest.bodyFatPercent.toFixed(1)}%.`;
    const trend = scans.map((s) => `${s.scanDate.toISOString().split("T")[0]}: ${s.bodyFatPercent.toFixed(1)}%`).join("; ");
    const change = latest.bodyFatPercent - oldest.bodyFatPercent;
    return `Body fat trend for ${fullName}: ${trend}. Overall change: ${fmt(change, true)} percentage points.`;
  }

  if (q.includes("lean mass") && ["trend", "history", "progress", "change"].some((w) => q.includes(w))) {
    if (scans.length === 1) return `${fullName} only has one scan so there is no trend yet. Current lean mass: ${latest.leanMassKg.toFixed(1)} kg.`;
    const trend = scans.map((s) => `${s.scanDate.toISOString().split("T")[0]}: ${s.leanMassKg.toFixed(1)} kg`).join("; ");
    const change = latest.leanMassKg - oldest.leanMassKg;
    return `Lean mass trend for ${fullName}: ${trend}. Overall change: ${fmt(change, true)} kg.`;
  }

  if (q.includes("how many scans") || q.includes("scan count")) {
    return `${fullName} has ${scans.length} recorded scan${scans.length !== 1 ? "s" : ""}.`;
  }

  if (q.includes("what changed") || q.includes("since last")) {
    if (!previous) return `${fullName} only has one scan so nothing to compare yet.`;
    return `From previous to latest scan for ${fullName}: weight ${fmt(latest.weightKg - previous.weightKg, true)} kg, body fat ${fmt(latest.bodyFatPercent - previous.bodyFatPercent, true)}%, fat mass ${fmt(latest.fatMassKg - previous.fatMassKg, true)} kg, lean mass ${fmt(latest.leanMassKg - previous.leanMassKg, true)} kg.`;
  }

  if (["focus", "coaching", "next session"].some((w) => q.includes(w))) {
    if (!previous) return `${fullName} only has one scan. I would focus on helping them understand their baseline numbers before making any changes.`;
    const leanChange = latest.leanMassKg - previous.leanMassKg;
    const fatChange = latest.fatMassKg - previous.fatMassKg;
    const bodyFatChange = latest.bodyFatPercent - previous.bodyFatPercent;
    if (leanChange < 0) return `For ${fullName}, focus on rebuilding lean mass. They lost ${Math.abs(leanChange).toFixed(1)} kg of lean mass since the last scan.`;
    if (fatChange > 0 || bodyFatChange > 0) return `For ${fullName}, focus on nutrition and activity. Fat mass went up ${fmt(fatChange, true)} kg and body fat changed ${fmt(bodyFatChange, true)}% since last scan.`;
    return `For ${fullName}, keep doing what they are doing. Lean mass and body fat are both trending in the right direction.`;
  }

  let summary = `${fullName} has ${scans.length} scan${scans.length !== 1 ? "s" : ""}. `;
  summary += `Latest scan on ${latestDate}: weight ${latest.weightKg.toFixed(1)} kg, body fat ${latest.bodyFatPercent.toFixed(1)}%, fat mass ${latest.fatMassKg.toFixed(1)} kg, lean mass ${latest.leanMassKg.toFixed(1)} kg.`;
  if (previous) {
    summary += ` Compared to the previous scan: weight ${fmt(latest.weightKg - previous.weightKg, true)} kg, body fat ${fmt(latest.bodyFatPercent - previous.bodyFatPercent, true)}%, lean mass ${fmt(latest.leanMassKg - previous.leanMassKg, true)} kg.`;
  }
  return summary;
}

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ScanUpload } from "@/components/scan-upload";
import { LogoutButton } from "@/components/logout-button";
import { BodyCompositionChart } from "@/components/body-composition-chart";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const memberId = (session?.user as any)?.memberId;
  if (!session || !memberId) redirect("/login");

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { scans: { orderBy: { scanDate: "asc" } } },
  });

  if (!member) redirect("/login");

  const scans = member.scans;
  const latest = scans[scans.length - 1];
  const first = scans[0];
  const previous = scans[scans.length - 2];

  const chartData = scans.map((s) => ({
    date: new Date(s.scanDate).toLocaleDateString(),
    bodyFat: s.bodyFatPercent,
    leanMass: s.leanMassKg,
    weight: s.weightKg,
    fatMass: s.fatMassKg,
  }));

  return (
    <main style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "22px", margin: 0 }}>Welcome, {member.fullName}</h1>
            <p style={{ fontSize: "13px", color: "#666", margin: "4px 0 0" }}>Goal: {member.goal || "No goal set"}</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <ScanUpload memberId={member.id} />
            <LogoutButton callbackUrl="/login" />
          </div>
        </div>

        {/* Current stats */}
        <div style={{ backgroundColor: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", marginBottom: "16px", marginTop: 0 }}>Latest Scan — {new Date(latest.scanDate).toLocaleDateString()}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            <div style={{ border: "1px solid #eee", borderRadius: "6px", padding: "12px" }}>
              <p style={{ fontSize: "12px", color: "#888", margin: "0 0 4px" }}>Weight</p>
              <p style={{ fontSize: "22px", fontWeight: 600, margin: 0 }}>{latest.weightKg.toFixed(1)} kg</p>
              {scans.length > 1 && (
                <p style={{ fontSize: "12px", color: latest.weightKg - first.weightKg < 0 ? "green" : "#d00", margin: "4px 0 0" }}>
                  {(latest.weightKg - first.weightKg > 0 ? "+" : "") + (latest.weightKg - first.weightKg).toFixed(1)} kg since start
                </p>
              )}
            </div>

            <div style={{ border: "1px solid #eee", borderRadius: "6px", padding: "12px" }}>
              <p style={{ fontSize: "12px", color: "#888", margin: "0 0 4px" }}>Body Fat %</p>
              <p style={{ fontSize: "22px", fontWeight: 600, margin: 0 }}>{latest.bodyFatPercent.toFixed(1)}%</p>
              {scans.length > 1 && (
                <p style={{ fontSize: "12px", color: latest.bodyFatPercent - first.bodyFatPercent < 0 ? "green" : "#d00", margin: "4px 0 0" }}>
                  {(latest.bodyFatPercent - first.bodyFatPercent > 0 ? "+" : "") + (latest.bodyFatPercent - first.bodyFatPercent).toFixed(1)}% since start
                </p>
              )}
            </div>

            <div style={{ border: "1px solid #eee", borderRadius: "6px", padding: "12px" }}>
              <p style={{ fontSize: "12px", color: "#888", margin: "0 0 4px" }}>Lean Mass</p>
              <p style={{ fontSize: "22px", fontWeight: 600, margin: 0 }}>{latest.leanMassKg.toFixed(1)} kg</p>
              {scans.length > 1 && (
                <p style={{ fontSize: "12px", color: latest.leanMassKg - first.leanMassKg > 0 ? "green" : "#d00", margin: "4px 0 0" }}>
                  {(latest.leanMassKg - first.leanMassKg > 0 ? "+" : "") + (latest.leanMassKg - first.leanMassKg).toFixed(1)} kg since start
                </p>
              )}
            </div>

            <div style={{ border: "1px solid #eee", borderRadius: "6px", padding: "12px" }}>
              <p style={{ fontSize: "12px", color: "#888", margin: "0 0 4px" }}>Fat Mass</p>
              <p style={{ fontSize: "22px", fontWeight: 600, margin: 0 }}>{latest.fatMassKg.toFixed(1)} kg</p>
              {scans.length > 1 && (
                <p style={{ fontSize: "12px", color: latest.fatMassKg - first.fatMassKg < 0 ? "green" : "#d00", margin: "4px 0 0" }}>
                  {(latest.fatMassKg - first.fatMassKg > 0 ? "+" : "") + (latest.fatMassKg - first.fatMassKg).toFixed(1)} kg since start
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Journey note for first scan */}
        {scans.length === 1 && (
          <div style={{ backgroundColor: "#fffbe6", border: "1px solid #ffe58f", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
            <p style={{ margin: 0, fontSize: "14px" }}>
              <strong>This is your first scan!</strong> This is your baseline. Upload your next scan after a few weeks to start seeing progress trends.
            </p>
            <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: "4px", padding: "10px" }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>Body fat %</p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666" }}>Percentage of your weight that is fat tissue.</p>
              </div>
              <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: "4px", padding: "10px" }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>Lean mass</p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666" }}>Everything that is not fat — muscle, organs, water.</p>
              </div>
            </div>
          </div>
        )}

        {/* Comparison note for second scan */}
        {scans.length === 2 && previous && (
          <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
            <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600 }}>Comparison with your first scan:</p>
            <p style={{ margin: "0", fontSize: "13px" }}>
              Weight: {(latest.weightKg - first.weightKg > 0 ? "+" : "") + (latest.weightKg - first.weightKg).toFixed(1)} kg &nbsp;|&nbsp;
              Body fat: {(latest.bodyFatPercent - first.bodyFatPercent > 0 ? "+" : "") + (latest.bodyFatPercent - first.bodyFatPercent).toFixed(1)}% &nbsp;|&nbsp;
              Lean mass: {(latest.leanMassKg - first.leanMassKg > 0 ? "+" : "") + (latest.leanMassKg - first.leanMassKg).toFixed(1)} kg &nbsp;|&nbsp;
              Fat mass: {(latest.fatMassKg - first.fatMassKg > 0 ? "+" : "") + (latest.fatMassKg - first.fatMassKg).toFixed(1)} kg
            </p>
          </div>
        )}

        {/* Trend note for 3+ scans */}
        {scans.length >= 3 && previous && (
          <div style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
            <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600 }}>Long-term progress ({scans.length} scans)</p>
            <p style={{ margin: 0, fontSize: "13px" }}>
              Body fat since start: {(latest.bodyFatPercent - first.bodyFatPercent > 0 ? "+" : "") + (latest.bodyFatPercent - first.bodyFatPercent).toFixed(1)}% &nbsp;|&nbsp;
              Since last scan: {(latest.bodyFatPercent - previous.bodyFatPercent > 0 ? "+" : "") + (latest.bodyFatPercent - previous.bodyFatPercent).toFixed(1)}%
            </p>
          </div>
        )}

        {/* Chart for 2+ scans */}
        {scans.length >= 2 && (
          <div style={{ marginBottom: "20px" }}>
            <BodyCompositionChart data={chartData} />
          </div>
        )}

        {/* Scan history table */}
        <div style={{ backgroundColor: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "20px" }}>
          <h2 style={{ fontSize: "16px", marginBottom: "16px", marginTop: 0 }}>Scan History ({scans.length} total)</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "#555", fontWeight: 600 }}>Date</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "#555", fontWeight: 600 }}>Weight</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "#555", fontWeight: 600 }}>Body Fat %</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "#555", fontWeight: 600 }}>Fat Mass</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "#555", fontWeight: 600 }}>Lean Mass</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "8px 12px" }}>{new Date(s.scanDate).toLocaleDateString()}</td>
                  <td style={{ padding: "8px 12px" }}>{s.weightKg.toFixed(1)} kg</td>
                  <td style={{ padding: "8px 12px" }}>{s.bodyFatPercent.toFixed(1)}%</td>
                  <td style={{ padding: "8px 12px" }}>{s.fatMassKg.toFixed(1)} kg</td>
                  <td style={{ padding: "8px 12px" }}>{s.leanMassKg.toFixed(1)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}

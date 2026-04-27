import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function makeScan(
  scanDate: string,
  weightKg: number,
  bodyFatPercent: number,
  fatMassKg: number,
  leanMassKg: number,
  extra: Partial<{
    visceralFatMassKg: number;
    boneMassKg: number;
    bmrKcal: number;
    trunkFatKg: number;
    trunkLeanMassKg: number;
    androidFatPercent: number;
    gynoidFatPercent: number;
    notes: string;
  }> = {},
) {
  return {
    scanDate: new Date(scanDate),
    weightKg,
    bodyFatPercent,
    fatMassKg,
    leanMassKg,
    visceralFatMassKg: extra.visceralFatMassKg ?? 1.2,
    boneMassKg: extra.boneMassKg ?? 2.7,
    bmrKcal: extra.bmrKcal ?? 1520,
    trunkFatKg: extra.trunkFatKg ?? 10.0,
    trunkLeanMassKg: extra.trunkLeanMassKg ?? 24.0,
    androidFatPercent: extra.androidFatPercent ?? bodyFatPercent + 5,
    gynoidFatPercent: extra.gynoidFatPercent ?? bodyFatPercent + 2,
    notes: extra.notes ?? null,
  };
}

async function createMember(args: {
  email: string;
  password: string;
  fullName: string;
  goal: string;
  heightCm?: number;
  sex?: string;
  scans: ReturnType<typeof makeScan>[];
}) {
  const passwordHash = await bcrypt.hash(args.password, 10);

  return prisma.user.create({
    data: {
      email: args.email,
      passwordHash,
      role: UserRole.MEMBER,
      member: {
        create: {
          fullName: args.fullName,
          goal: args.goal,
          heightCm: args.heightCm ?? 170,
          sex: args.sex ?? "F",
          scans: {
            create: args.scans,
          },
        },
      },
    },
  });
}

async function main() {
  await prisma.scan.deleteMany();
  await prisma.uploadedFile.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();

  await createMember({
    email: "sarah@example.com",
    password: "password123",
    fullName: "Sarah Chen",
    goal: "Reduce body fat while maintaining lean mass",
    scans: [
      makeScan("2025-12-10", 71.8, 31.2, 22.4, 46.8, {
        trunkFatKg: 11.6,
        trunkLeanMassKg: 22.3,
        bmrKcal: 1480,
      }),
    ],
  });

  await createMember({
    email: "jordan@example.com",
    password: "password123",
    fullName: "Jordan Lee",
    goal: "Gain lean mass without increasing fat mass",
    sex: "M",
    heightCm: 178,
    scans: [
      makeScan("2025-09-04", 84.2, 24.8, 20.9, 58.3, {
        trunkFatKg: 9.5,
        trunkLeanMassKg: 29.7,
        bmrKcal: 1730,
      }),
      makeScan("2025-12-09", 83.4, 22.9, 19.1, 59.4, {
        trunkFatKg: 8.4,
        trunkLeanMassKg: 30.2,
        bmrKcal: 1755,
      }),
    ],
  });

  await createMember({
    email: "maria@example.com",
    password: "password123",
    fullName: "Maria Gomez",
    goal: "Steady recomposition and consistency",
    scans: [
      makeScan("2025-04-12", 67.2, 30.1, 20.2, 43.9, {
        trunkFatKg: 9.8,
        trunkLeanMassKg: 20.6,
      }),
      makeScan("2025-06-15", 66.4, 28.6, 19.0, 44.4, {
        trunkFatKg: 9.0,
        trunkLeanMassKg: 20.9,
      }),
      makeScan("2025-09-18", 65.5, 27.4, 17.9, 45.0, {
        trunkFatKg: 8.4,
        trunkLeanMassKg: 21.1,
      }),
      makeScan("2025-12-20", 64.9, 26.1, 16.9, 45.6, {
        trunkFatKg: 7.8,
        trunkLeanMassKg: 21.4,
      }),
    ],
  });

  await createMember({
    email: "david@example.com",
    password: "password123",
    fullName: "David Patel",
    goal: "Cut weight gradually for performance",
    sex: "M",
    heightCm: 182,
    scans: [
      makeScan("2025-02-11", 91.0, 27.8, 25.3, 62.1, {
        trunkFatKg: 13.0,
        trunkLeanMassKg: 31.0,
        bmrKcal: 1820,
      }),
      makeScan("2025-04-11", 89.8, 26.9, 24.2, 62.4, {
        trunkFatKg: 12.4,
        trunkLeanMassKg: 31.2,
        bmrKcal: 1830,
      }),
      makeScan("2025-06-13", 88.6, 25.4, 22.5, 62.9, {
        trunkFatKg: 11.5,
        trunkLeanMassKg: 31.4,
        bmrKcal: 1840,
      }),
      makeScan("2025-08-14", 87.7, 24.9, 21.8, 63.0, {
        trunkFatKg: 11.0,
        trunkLeanMassKg: 31.5,
        bmrKcal: 1846,
      }),
      makeScan("2025-10-16", 86.9, 24.1, 20.9, 63.2, {
        trunkFatKg: 10.5,
        trunkLeanMassKg: 31.6,
        bmrKcal: 1852,
      }),
      makeScan("2025-12-18", 85.8, 22.8, 19.6, 63.5, {
        trunkFatKg: 9.8,
        trunkLeanMassKg: 31.8,
        bmrKcal: 1860,
      }),
    ],
  });

  await createMember({
    email: "ava@example.com",
    password: "password123",
    fullName: "Ava Nguyen",
    goal: "Improve body composition and strength",
    scans: [
      makeScan("2025-11-01", 60.8, 28.9, 17.6, 41.8, {
        trunkFatKg: 8.6,
        trunkLeanMassKg: 20.3,
        bmrKcal: 1410,
      }),
      makeScan("2025-12-28", 60.1, 27.7, 16.6, 42.4, {
        trunkFatKg: 8.0,
        trunkLeanMassKg: 20.6,
        bmrKcal: 1425,
      }),
    ],
  });

  const coachHash = await bcrypt.hash("password123", 10);

  await prisma.user.create({
    data: {
      email: "coach@kalos.com",
      passwordHash: coachHash,
      role: UserRole.COACH,
    },
  });

  console.log("Seeded demo users:");
  console.log("sarah@example.com / password123");
  console.log("jordan@example.com / password123");
  console.log("maria@example.com / password123");
  console.log("david@example.com / password123");
  console.log("coach@kalos.com / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

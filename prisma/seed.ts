import { PrismaClient } from "../src/generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Hash password user
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Buat user
  const user = await prisma.user.create({
    data: {
      username: "admin",
      password: hashedPassword,
    },
  });

  // Buat sesi
  const sesi1 = await prisma.sesi.create({
    data: {
      nama: "Sesi 1 (11.00 - 13.00)",
      harga: 85000
    },
  });

  const sesi2 = await prisma.sesi.create({
    data: {
      nama: "Sesi 2 (13.00 - 15.00)",
      harga: 85000
    },
  });
  const sesi3 = await prisma.sesi.create({
    data: {
      nama: "Sesi 3 (15.00 - 17.00)",
      harga: 85000
    },
  });
  const sesi4 = await prisma.sesi.create({
    data: {
      nama: "Sesi 4 (17.00 - 19.00)",
      harga: 85000
    },
  });
  const sesi5 = await prisma.sesi.create({
    data: {
      nama: "Sesi 5 (19.00 - 21.00)",
      harga: 85000
    },
  });
  const sesi6 = await prisma.sesi.create({
    data: {
      nama: "Sesi 6 (21.00 - 23.00)",
      harga: 85000
    },
  });
  const sesi7 = await prisma.sesi.create({
    data: {
      nama: "Sesi 7 (23.00 - 01.00)",
      harga: 85000
    },
  });

  // Buat additional
  const senargitar = await prisma.additional.create({
    data: {
      nama: "Senar Gitar",
      harga: 10000,
    },
  });

  const senarbass = await prisma.additional.create({
    data: {
      nama: "Senar bass",
      harga: 50000,
    },
  });
  const pickgitar = await prisma.additional.create({
    data: {
      nama: "5000",
      harga: 75000,
    },
  });
  const stickdrum = await prisma.additional.create({
    data: {
      nama: "Stick Drum",
      harga: 25000,
    },
  });
  const airputih = await prisma.additional.create({
    data: {
      nama: "Air Putih",
      harga: 5000,
    },
  });
  const teh = await prisma.additional.create({
    data: {
      nama: "Teh",
      harga: 5000,
    },
  });
  const kopi = await prisma.additional.create({
    data: {
      nama: "Kopi",
      harga: 5000,
    },
  });

  console.log("Seed data berhasil dimasukkan.");
}

main()
  .catch((e) => {
    console.error("Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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
  const sesiPagi = await prisma.sesi.create({
    data: {
      nama: "Sesi 1 (09.00 - 12.00)",
      harga: 85000
    },
  });

  const sesiSore = await prisma.sesi.create({
    data: {
      nama: "Sesi 2 (13.00 - 16.00)",
      harga: 85000
    },
  });

  // Buat additional
  const additionalMakeup = await prisma.additional.create({
    data: {
      nama: "Makeup",
      harga: 50000,
    },
  });

  const additionalHairdo = await prisma.additional.create({
    data: {
      nama: "Hairdo",
      harga: 75000,
    },
  });

  // Buat transaksi
  const transaksi = await prisma.transaksi.create({
    data: {
      user_id: user.user_id,
      total_harga: 300000,
      nama_customer: "John Doe",
      tanggal_transaksi: new Date(),
      nomor_telepon: "081234567890",
      catatan: "Bawa gitar sendiri",
      metode_bayar: "DP",
      jumlah_bayar: 100000,
      sisa_bayar: 200000,
      status_studio: "Sudah Booking",
      status_bayar: "Belum Lunas",
    },
  });

  // Tambahkan detail transaksi
  const detailTransaksi = await prisma.detail_Transaksi.create({
    data: {
      transaksi_id: transaksi.transaksi_id,
      // nama_layanan_item: "Sewa Studio",
      subtotal: 150000,
      jumlah: 1,
      // sesi: "Sesi 1 (09.00 - 12.00)",
    },
  });

  // Tambahkan sesi ke detail transaksi
  const today = new Date();
  await prisma.detail_Transaksi_Sesi.createMany({
    data: [
      {
        detail_transaksi_id: detailTransaksi.detail_transaksi_id,
        sesi_id: sesiPagi.sesi_id,
        tanggal_sesi: today,
      },
      {
        detail_transaksi_id: detailTransaksi.detail_transaksi_id,
        sesi_id: sesiSore.sesi_id,
        tanggal_sesi: today,
      },
    ],
  });

  // Tambahkan additional ke detail transaksi
  await prisma.detail_Additional.createMany({
    data: [
      {
        detail_transaksi_id: detailTransaksi.detail_transaksi_id,
        additional_id: additionalMakeup.additional_id,
        jumlah: 1,
      },
      {
        detail_transaksi_id: detailTransaksi.detail_transaksi_id,
        additional_id: additionalHairdo.additional_id,
        jumlah: 2,
      },
    ],
  });

  // Tambahkan presensi user
  await prisma.presensi.create({
    data: {
      userId: user.user_id,
      status: "Hadir",
      clock_in: new Date(),
      clock_out: new Date(),
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

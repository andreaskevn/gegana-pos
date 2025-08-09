import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    endOfToday.setHours(23, 59, 59, 999);

    const [transaksiBulanIni, totalUsers, sesiHariIni, transaksiTerbaru] =
      await Promise.all([
        prisma.transaksi.findMany({
          where: {
            tanggal_transaksi: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        prisma.user.count(),
        prisma.detail_Transaksi_Sesi.count({
          where: {
            tanggal_sesi: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        }),
        prisma.transaksi.findMany({
          take: 5,
          orderBy: {
            tanggal_transaksi: "desc",
          },
        }),
      ]);

    const pendapatanBulanIni = transaksiBulanIni.reduce(
      (sum, trx) => sum + trx.total_harga,
      0
    );
    const totalTransaksiBulanIni = transaksiBulanIni.length;

    return NextResponse.json({
      pendapatanBulanIni,
      totalTransaksiBulanIni,
      totalUsers,
      sesiBookingHariIni: sesiHariIni,
      transaksiTerbaru,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

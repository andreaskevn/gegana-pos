import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { user_id: string };
    const body = await req.json();
    const transaksi_id = (await params).id;

    const dataToUpdate: {
      jumlah_bayar?: number;
      sisa_bayar?: number;
      status_bayar?: string;
      status_studio?: "Booked" | "On Progress" | "Selesai";
    } = {};

    const transaksiLama = await prisma.transaksi.findUnique({
      where: { transaksi_id },
    });

    if (!transaksiLama) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    if (body.bayar_sisa !== undefined) {
      if (transaksiLama.status_bayar === "Lunas") {
        return NextResponse.json(
          { error: "Transaksi sudah lunas" },
          { status: 400 }
        );
      }
      const jumlah_bayar_baru = transaksiLama.jumlah_bayar + body.bayar_sisa;
      const sisa_bayar_baru = transaksiLama.total_harga - jumlah_bayar_baru;

      dataToUpdate.jumlah_bayar = jumlah_bayar_baru;
      dataToUpdate.sisa_bayar = sisa_bayar_baru;
      dataToUpdate.status_bayar =
        sisa_bayar_baru <= 0 ? "Lunas" : "Belum Lunas";
    }

    if (body.status_studio) {
      dataToUpdate.status_studio = body.status_studio;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data untuk diupdate" },
        { status: 400 }
      );
    }

    const transaksi = await prisma.transaksi.update({
      where: { transaksi_id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, transaksi });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

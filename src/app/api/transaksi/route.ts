import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient, Prisma } from "@/generated/prisma";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const body = await req.json();
    const sisa_bayar = body.total_harga - body.jumlah_bayar;
    const status_bayar = sisa_bayar === 0 ? "Lunas" : "Belum Lunas";

    const transaksi = await prisma.transaksi.create({
      data: {
        user_id: decoded.userId,
        total_harga: body.total_harga,
        nama_customer: body.nama_customer,
        tanggal_transaksi: new Date(body.tanggal_transaksi),
        nomor_telepon: body.nomor_telepon,
        catatan: body.catatan,
        metode_bayar: body.metode_bayar,
        jumlah_bayar: body.jumlah_bayar,
        sisa_bayar: sisa_bayar,
        status_studio: body.status_studio,
        status_bayar: status_bayar,
        detailTransaksi: {
          create: body.detailTransaksi.map((detail: any) => ({
            subtotal: detail.subtotal,
            jumlah: detail.jumlah,
            Detail_Transaksi_Sesi: {
              create: detail.sesiDetails.map((sesiDetail: any) => ({
                sesi_id: sesiDetail.sesi_id,
                tanggal_sesi: new Date(sesiDetail.tanggal_sesi),
              })),
            },
            Detail_Additional: {
              create: detail.additionalItems.map((additional: any) => ({
                additional_id: additional.additional_id,
                jumlah: additional.jumlah,
              })),
            },
          })),
        },
      },
      include: {
        detailTransaksi: {
          include: {
            Detail_Transaksi_Sesi: true,
            Detail_Additional: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, transaksi });
  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const download = searchParams.get("download");

    const skip = (page - 1) * limit;
    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.tanggal_transaksi = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // 2. Berikan tipe eksplisit pada findManyOptions
    const findManyOptions: Prisma.TransaksiFindManyArgs = {
      where: whereClause,
      orderBy: { tanggal_transaksi: "desc" },
      include: {
        detailTransaksi: {
          include: {
            Detail_Transaksi_Sesi: true,
            Detail_Additional: true,
          },
        },
      },
      ...(download !== "true" && { skip, take: limit }),
    };

    const [transaksi, totalTransaksi, aggregations] = await Promise.all([
      prisma.transaksi.findMany(findManyOptions),
      prisma.transaksi.count({ where: whereClause }),
      prisma.transaksi.aggregate({
        where: whereClause,
        _sum: {
          total_harga: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      transaksi,
      totalTransaksi,
      totalPages: Math.ceil(totalTransaksi / limit),
      totalPendapatan: aggregations._sum.total_harga || 0,
    });
  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { authenticateJWT } from "@/app/lib/middleware/auth";
import { endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (startDate && endDate) {
      const presensi = await prisma.presensi.findMany({
        where: {
          clock_in: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: { user: { select: { username: true } } },
        orderBy: { clock_in: "desc" },
      });
      return NextResponse.json({ presensi });
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const [presensi, totalPresensi] = await Promise.all([
      prisma.presensi.findMany({
        skip,
        take: limit,
        include: { user: { select: { username: true } } },
        orderBy: { clock_in: "desc" },
      }),
      prisma.presensi.count(),
    ]);

    return NextResponse.json({
      presensi,
      totalPresensi,
      totalPages: Math.ceil(totalPresensi / limit),
    });
  } catch (err) {
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const decoded: any = authenticateJWT(req);
    if (!decoded || decoded instanceof NextResponse) {
      return decoded;
    }

    if ((decoded as any)?.status) {
      return decoded;
    }

    const userId = decoded.userId;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID tidak ditemukan" }),
        { status: 400 }
      );
    }

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endOfDay.setHours(23, 59, 59, 999);

    const todaysPresensi = await prisma.presensi.findFirst({
      where: {
        userId: userId,
        clock_in: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (todaysPresensi) {
      if (todaysPresensi.clock_out) {
        return NextResponse.json(
          {
            error:
              "Anda sudah melakukan presensi dan clock out hari ini. Silakan coba lagi besok.",
          },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          { error: "Anda sudah melakukan clock in hari ini." },
          { status: 409 }
        );
      }
    }

    const presensi = await prisma.presensi.create({
      data: {
        userId,
        clock_in: new Date(),
        clock_out: null,
        status: "Hadir",
      },
    });

    return NextResponse.json({ presensi }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.id;

    const now = new Date();

    const lastPresensi = await prisma.presensi.findFirst({
      where: {
        userId,
        clock_out: null,
      },
      orderBy: {
        clock_in: "desc",
      },
    });

    if (!lastPresensi) {
      return NextResponse.json(
        { message: "Tidak ada presensi yang perlu di-clockout" },
        { status: 404 }
      );
    }

    const updatedPresensi = await prisma.presensi.update({
      where: { id: lastPresensi.id },
      data: { clock_out: now },
    });

    return NextResponse.json({ presensi: updatedPresensi }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

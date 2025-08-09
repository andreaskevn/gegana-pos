import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";    

export async function GET() {
    try {
        const sesis = await prisma.sesi.findMany();
        return NextResponse.json({ sesis }, { status: 200})
    } catch (error) {
        return NextResponse.json({ error: "Terjadi kesalahan"}, {status: 500})
    }
}
// app/api/users/[id]/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const targetUserId = (await params).id; 

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    const requesterRole = decoded.role;

    if (requesterRole !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya admin yang dapat mengubah role.' }, { status: 403 }); // 403 Forbidden
    }

    const { role: newRole } = await req.json();

    if (!newRole || !['admin', 'user'].includes(newRole)) {
      return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: {
        user_id: targetUserId,
      },
      data: {
        role: newRole,
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ success: true, user: userWithoutPassword });

  } catch (error) {
    return NextResponse.json({ error: 'Token tidak valid atau terjadi kesalahan' }, { status: 401 });
  }
}
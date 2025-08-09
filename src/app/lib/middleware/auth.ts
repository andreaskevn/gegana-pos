// lib/middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function authenticateJWT(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1]; // pisah "Bearer <token>"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded; // bisa return userId jika kamu butuh
  } catch (err) {
    return NextResponse.json({ error: 'Token tidak valid' }, { status: 403 });
  }
}

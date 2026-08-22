import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { tokenHash: token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    const newPasswordHash = verificationToken.newPasswordHash;
    if (!newPasswordHash) {
      return NextResponse.json({ error: 'No password change requested' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email: verificationToken.email },
      data: { password: newPasswordHash },
    });

    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error verifying forgot password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
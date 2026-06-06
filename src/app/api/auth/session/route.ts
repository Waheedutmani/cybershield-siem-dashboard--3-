import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = getSession(token);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: session.user });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

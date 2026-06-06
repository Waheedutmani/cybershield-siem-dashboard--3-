import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const BROWSERS = ['Chrome 120', 'Firefox 121', 'Safari 17', 'Edge 120', 'Chrome 119', 'Firefox 120'];
const OS_LIST = ['Windows 11', 'macOS Sonoma', 'Ubuntu 22.04', 'Windows 10', 'macOS Ventura', 'Linux Mint'];
const DEVICES = ['Desktop', 'Laptop', 'Desktop', 'Laptop', 'Desktop'];

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all active users from DB
    const users = await db.user.findMany({
      where: { status: 'Active' },
      select: { id: true, name: true, email: true, role: true, lastLogin: true },
    });

    // Generate simulated session data for each user
    const sessions = users.map((user, idx) => {
      const browser = BROWSERS[idx % BROWSERS.length];
      const os = OS_LIST[idx % OS_LIST.length];
      const device = DEVICES[idx % DEVICES.length];
      const loginTime = user.lastLogin
        ? user.lastLogin.getTime()
        : Date.now() - (Math.random() * 8 * 60 * 60 * 1000);
      const lastActivity = loginTime + Math.random() * 3 * 60 * 60 * 1000;
      const duration = Math.floor((Date.now() - loginTime) / 60000);
      const isActive = (Date.now() - lastActivity) < 30 * 60 * 1000; // active in last 30 min

      // Generate a realistic-looking IP
      const ipBase = [192, 172, 10, 203];
      const ip = `${ipBase[idx % ipBase.length]}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255) + 1}`;

      return {
        id: `sess_${user.id.slice(0, 8)}_${Date.now().toString(36)}`,
        userId: user.id,
        userName: user.name,
        email: user.email,
        role: user.role,
        ipAddress: ip,
        browser,
        os,
        device,
        loginTime: new Date(loginTime).toISOString(),
        lastActivity: new Date(lastActivity).toISOString(),
        duration,
        isActive,
      };
    });

    const activeCount = sessions.filter((s) => s.isActive).length;

    return NextResponse.json({
      sessions,
      activeCount,
      totalSessions: sessions.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    if (!sessionId) return NextResponse.json({ error: 'Session ID required' }, { status: 400 });

    // Simulate killing a session (no real session store to remove from)
    return NextResponse.json({ success: true, message: `Session ${sessionId} terminated` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

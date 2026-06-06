import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, status } = body;

    if (!name || !name.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!email || !email.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    if (!role || !['Admin', 'Analyst', 'User'].includes(role)) return NextResponse.json({ error: 'Valid role is required (Admin, Analyst, User)' }, { status: 400 });
    if (!status || !['Active', 'Suspended'].includes(status)) return NextResponse.json({ error: 'Valid status is required (Active, Suspended)' }, { status: 400 });

    const existingUser = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });

    const hashedPassword = hashPassword(password);

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role,
        status,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    await db.activityLog.create({
      data: {
        action: 'USER_CREATED',
        userId: session.user.id,
        details: `Admin ${session.user.name} created new user ${user.email} with role=${user.role}`,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, name, role, status } = body;

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const updateData: Record<string, string> = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (role && ['Admin', 'Analyst', 'User'].includes(role)) updateData.role = role;
    if (status && ['Active', 'Suspended'].includes(status)) updateData.status = status;

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    await db.activityLog.create({
      data: {
        action: 'USER_UPDATED',
        userId: session.user.id,
        details: `Admin ${session.user.name} updated user ${user.email}: name=${user.name}, role=${user.role}, status=${user.status}`,
      },
    });

    return NextResponse.json({ user });
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
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await db.user.delete({ where: { id: userId } });

    await db.activityLog.create({
      data: {
        action: 'USER_DELETED',
        userId: session.user.id,
        details: `Admin ${session.user.name} deleted user ${targetUser.email}`,
      },
    });

    return NextResponse.json({ message: `User ${targetUser.name} has been permanently deleted` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

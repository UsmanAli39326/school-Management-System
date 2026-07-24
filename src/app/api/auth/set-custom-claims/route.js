import { NextResponse } from 'next/server';
import { adminAuth } from '@/firebase/admin';

export async function POST(request) {
  try {
    const { uid, role, schoolId } = await request.json();

    if (!uid || !role) {
      return NextResponse.json(
        { error: 'Missing required parameters: uid and role' },
        { status: 400 }
      );
    }

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin Auth is not configured on server' },
        { status: 500 }
      );
    }

    const validRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'TEACHER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role specified. Must be one of ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const claims = {
      role,
      schoolId: role === 'SUPER_ADMIN' ? 'GLOBAL' : schoolId || null,
    };

    await adminAuth.setCustomUserClaims(uid, claims);

    return NextResponse.json({
      success: true,
      message: `Successfully set custom claims for user ${uid}`,
      claims,
    });
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

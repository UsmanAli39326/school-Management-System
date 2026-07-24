import { NextResponse } from 'next/server';
import { adminAuth } from '@/firebase/admin';

export async function POST(request) {
  try {
    // 1. Authenticate the caller
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (err) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid ID token' },
        { status: 401 }
      );
    }

    // 2. Authorize the caller
    // Only SUPER_ADMIN can provision new users
    if (decodedToken.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only SUPER_ADMIN can provision users' },
        { status: 403 }
      );
    }

    // 3. Extract request body
    const { email, password, displayName, role, schoolId } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required parameters: email, password, and role' },
        { status: 400 }
      );
    }

    const validRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'TEACHER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role specified. Must be one of ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // 4. Create the Auth account
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || undefined,
    });

    // 5. Set custom claims for the new user
    const claims = {
      role,
      schoolId: role === 'SUPER_ADMIN' ? 'GLOBAL' : schoolId || null,
    };
    await adminAuth.setCustomUserClaims(userRecord.uid, claims);

    // 6. Return success with the new UID
    return NextResponse.json({
      success: true,
      message: `Successfully created user ${userRecord.uid}`,
      uid: userRecord.uid,
      claims,
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

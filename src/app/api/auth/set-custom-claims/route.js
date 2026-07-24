import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/firebase/admin';

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
    if (decodedToken.role !== 'SUPER_ADMIN') {
      // If not SUPER_ADMIN, check if it is a self-registration setup
      if (decodedToken.uid === uid) {
        // Fetch the invitation to verify the role and schoolId
        const userEmail = decodedToken.email;
        const invitesSnapshot = await adminDb.collection('staff_invitations')
          .where('email', '==', userEmail)
          .where('status', 'in', ['PENDING', 'ACCEPTED'])
          .limit(1)
          .get();

        if (invitesSnapshot.empty) {
          return NextResponse.json(
            { error: 'Forbidden: No valid invitation found for self-registration' },
            { status: 403 }
          );
        }

        const invite = invitesSnapshot.docs[0].data();
        if (invite.role !== role || invite.schoolId !== schoolId) {
          return NextResponse.json(
            { error: 'Forbidden: Requested claims do not match invitation' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient privileges' },
          { status: 403 }
        );
      }
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

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  }),
});

const auth = admin.auth();
const db = admin.firestore();

async function setupDemo() {
  const demoUsers = [
    { email: 'superadmin@devtechnoz.com', password: 'admin123', role: 'SUPER_ADMIN', schoolId: 'GLOBAL', displayName: 'Super Admin' },
    { email: 'admin@apexschool.com', password: 'school123', role: 'SCHOOL_ADMIN', schoolId: 'apex-001', displayName: 'School Admin' },
    { email: 'accountant@apexschool.com', password: 'accountant123', role: 'ACCOUNTANT', schoolId: 'apex-001', displayName: 'Accountant' },
    { email: 'receptionist@apexschool.com', password: 'reception123', role: 'RECEPTIONIST', schoolId: 'apex-001', displayName: 'Receptionist' },
    { email: 'teacher@apexschool.com', password: 'teacher123', role: 'TEACHER', schoolId: 'apex-001', displayName: 'Sarah Jenkins' }
  ];

  console.log("Setting up demo school...");
  await db.collection('schools').doc('apex-001').set({
    schoolId: 'apex-001',
    name: 'Apex International School',
    status: 'ACTIVE',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  for (const u of demoUsers) {
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(u.email);
        console.log(`User ${u.email} already exists. Updating password...`);
        await auth.updateUser(userRecord.uid, { password: u.password });
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          console.log(`Creating user ${u.email}...`);
          userRecord = await auth.createUser({
            email: u.email,
            password: u.password,
            displayName: u.displayName,
          });
        } else {
          throw e;
        }
      }

      console.log(`Setting custom claims for ${u.email}...`);
      await auth.setCustomUserClaims(userRecord.uid, { role: u.role, schoolId: u.schoolId });

      console.log(`Creating Firestore profile for ${u.email}...`);
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        schoolId: u.schoolId,
        status: 'ACTIVE',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`✅ Successfully setup ${u.email}\n`);
    } catch (err) {
      console.error(`❌ Failed to setup ${u.email}:`, err.message, '\n');
    }
  }
  console.log("🎉 Setup complete! You can now log in with all demo accounts.");
  process.exit(0);
}

setupDemo();

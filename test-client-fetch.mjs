import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFetch() {
  try {
    console.log("Fetching schools with config:", firebaseConfig.projectId);
    const q = query(collection(db, 'schools'));
    const snapshot = await getDocs(q);
    const schools = [];
    snapshot.forEach((d) => {
      schools.push({ id: d.id, ...d.data() });
    });
    console.log("Schools fetched:", schools.length);
  } catch (error) {
    console.error('Error fetching schools:', error.code, error.message);
  }
  process.exit(0);
}

testFetch();

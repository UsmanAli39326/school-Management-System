import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../config';
import { getMonthlyCollection } from './fees';

const EXPENSES_COL = 'expenses';

// ----------------------------------------------------------------------
// EXPENSES
// ----------------------------------------------------------------------

export async function addExpense(schoolId, data, createdBy) {
  const expenseId = `exp_${Date.now()}`;
  const docRef = doc(db, EXPENSES_COL, expenseId);

  const newExpense = {
    expenseId,
    schoolId,
    category: data.category || 'Miscellaneous',
    amount: Number(data.amount) || 0,
    date: data.date ? new Date(data.date) : new Date(), // Storing as JS Date object which Firestore converts
    description: data.description || '',
    receiptUrl: data.receiptUrl || '',
    createdBy: createdBy || '',
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, newExpense);
  return { id: expenseId, ...newExpense };
}

export async function getExpenses(schoolId) {
  try {
    const q = query(
      collection(db, EXPENSES_COL),
      where('schoolId', '==', schoolId)
    );
    const snapshot = await getDocs(q);
    const items = [];
    snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
    
    // Sort descending by date client-side
    return items.sort((a, b) => {
      const tA = a.date?.toMillis?.() || (a.date instanceof Date ? a.date.getTime() : 0);
      const tB = b.date?.toMillis?.() || (b.date instanceof Date ? b.date.getTime() : 0);
      return tB - tA;
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
}

export async function deleteExpense(expenseId) {
  const docRef = doc(db, EXPENSES_COL, expenseId);
  await deleteDoc(docRef);
}

// ----------------------------------------------------------------------
// FINANCIAL SUMMARY
// ----------------------------------------------------------------------

export async function getMonthlyFinancialSummary(schoolId) {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // 1. Get Income (from Fees)
    const totalIncome = await getMonthlyCollection(schoolId);

    // 2. Get Expenses
    const q = query(
      collection(db, EXPENSES_COL),
      where('schoolId', '==', schoolId)
    );
    const snapshot = await getDocs(q);
    
    let totalExpenses = 0;
    snapshot.forEach(d => {
      const exp = d.data();
      const expTime = exp.date?.toMillis?.() || (exp.date instanceof Date ? exp.date.getTime() : 0);
      if (expTime >= currentMonthStart) {
        totalExpenses += (exp.amount || 0);
      }
    });

    return {
      income: totalIncome,
      expenses: totalExpenses,
      netBalance: totalIncome - totalExpenses
    };
  } catch (error) {
    console.error('Error calculating financial summary:', error);
    return { income: 0, expenses: 0, netBalance: 0 };
  }
}

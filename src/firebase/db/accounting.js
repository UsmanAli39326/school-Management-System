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
  const docRef = doc(collection(db, EXPENSES_COL));
  const expenseId = docRef.id;

  const newExpense = {
    expenseId,
    schoolId,
    category: data.category || 'Miscellaneous',
    vendorName: data.vendorName || '',
    vendorRef: data.vendorRef || '',
    amount: Number(data.amount) || 0,
    date: data.date ? new Date(data.date) : new Date(),
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

export async function getMonthlyFinancialSummary(schoolId, year = null, month = null) {
  try {
    const now = new Date();
    const targetYear = year !== null ? Number(year) : now.getFullYear();
    const targetMonth = month !== null ? Number(month) : now.getMonth();

    const monthStart = new Date(targetYear, targetMonth, 1).getTime();
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999).getTime();

    // 1. Get Expenses
    const q = query(
      collection(db, EXPENSES_COL),
      where('schoolId', '==', schoolId)
    );
    const snapshot = await getDocs(q);
    
    let totalExpenses = 0;
    const categoryBreakdown = {};

    snapshot.forEach(d => {
      const exp = d.data();
      const expTime = exp.date?.toMillis?.() || (exp.date instanceof Date ? exp.date.getTime() : 0);
      if (expTime >= monthStart && expTime <= monthEnd) {
        const amt = exp.amount || 0;
        totalExpenses += amt;
        const cat = exp.category || 'Miscellaneous';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
      }
    });

    // 2. Get Income (from Fees)
    const totalIncome = await getMonthlyCollection(schoolId);

    return {
      income: totalIncome,
      expenses: totalExpenses,
      netBalance: totalIncome - totalExpenses,
      categoryBreakdown
    };
  } catch (error) {
    console.error('Error calculating financial summary:', error);
    return { income: 0, expenses: 0, netBalance: 0, categoryBreakdown: {} };
  }
}


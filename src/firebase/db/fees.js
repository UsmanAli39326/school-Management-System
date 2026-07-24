import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config';

const STRUCTURES_COL = 'fee_structures';
const INVOICES_COL = 'invoices';
const PAYMENTS_COL = 'payments';
const LEDGERS_COL = 'student_ledgers';

// ----------------------------------------------------------------------
// FEE STRUCTURES
// ----------------------------------------------------------------------

export async function createFeeStructure(schoolId, data) {
  const structureId = data.structureId || `fs_${Date.now()}`;
  const docRef = doc(db, STRUCTURES_COL, structureId);

  const newStructure = {
    structureId,
    schoolId,
    level: data.level || '',
    feeType: data.feeType || 'Tuition',
    amount: Number(data.amount) || 0,
    frequency: data.frequency || 'MONTHLY',
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, newStructure);
  return { id: structureId, ...newStructure };
}

export async function getFeeStructures(schoolId) {
  try {
    const q = query(
      collection(db, STRUCTURES_COL),
      where('schoolId', '==', schoolId)
    );
    const snapshot = await getDocs(q);
    const items = [];
    snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
    return items;
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    return [];
  }
}

export async function deleteFeeStructure(structureId) {
  const docRef = doc(db, STRUCTURES_COL, structureId);
  await deleteDoc(docRef);
}

// ----------------------------------------------------------------------
// INVOICES
// ----------------------------------------------------------------------

export async function generateInvoicesForClass(schoolId, classId, students, feeStructures, feeMonth) {
  const batch = writeBatch(db);
  const generated = [];

  for (const student of students) {
    for (const fs of feeStructures) {
      const invoiceId = `inv_${student.id}_${fs.id}_${feeMonth}`;
      const docRef = doc(db, INVOICES_COL, invoiceId);
      
      // Check for custom fee concession for this student for this fee type
      let invoiceAmount = fs.amount;
      if (student.customFees && student.customFees[fs.feeType] !== undefined) {
        invoiceAmount = Number(student.customFees[fs.feeType]);
      }
      
      const newInvoice = {
        invoiceId,
        schoolId,
        invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        studentId: student.id,
        feeMonth,
        feeType: fs.feeType,
        amount: invoiceAmount,
        discount: 0,
        fine: 0,
        payableAmount: invoiceAmount,
        paidAmount: 0,
        remainingBalance: invoiceAmount,
        status: 'UNPAID', // UNPAID, PARTIAL, PAID, OVERDUE
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10), // e.g. 10th of current month
        createdAt: serverTimestamp(),
      };
      
      batch.set(docRef, newInvoice);
      
      // Also add a ledger entry
      const ledgerId = `ledg_chrg_${invoiceId}`;
      const ledgerRef = doc(db, LEDGERS_COL, ledgerId);
      batch.set(ledgerRef, {
        ledgerId,
        schoolId,
        studentId: student.id,
        date: serverTimestamp(),
        transactionType: 'CHARGE',
        description: `Invoice generated for ${fs.feeType} (${feeMonth})`,
        debit: invoiceAmount,
        credit: 0,
        invoiceId,
      });
      
      generated.push(newInvoice);
    }
  }

  await batch.commit();
  return generated;
}

export async function getInvoices(schoolId, studentId = null) {
  try {
    let q;
    if (studentId) {
      q = query(collection(db, INVOICES_COL), where('schoolId', '==', schoolId), where('studentId', '==', studentId));
    } else {
      q = query(collection(db, INVOICES_COL), where('schoolId', '==', schoolId));
    }
    const snapshot = await getDocs(q);
    const items = [];
    snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
    
    // Sort descending by creation date client-side
    return items.sort((a, b) => {
      const tA = a.createdAt?.toMillis?.() || 0;
      const tB = b.createdAt?.toMillis?.() || 0;
      return tB - tA;
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
}

// ----------------------------------------------------------------------
// PAYMENTS & LEDGER
// ----------------------------------------------------------------------

export async function collectPayment(schoolId, invoice, paymentDetails) {
  const batch = writeBatch(db);

  const paymentId = `pay_${Date.now()}`;
  const paymentRef = doc(db, PAYMENTS_COL, paymentId);
  
  const discountAmt = Number(paymentDetails.discount) || 0;
  const fineAmt = Number(paymentDetails.fine) || 0;
  const paidAmt = Number(paymentDetails.paidAmount) || 0;
  
  // Calculate new balances
  const newPayable = invoice.amount - discountAmt + fineAmt;
  const totalPaidNow = invoice.paidAmount + paidAmt;
  const newBalance = newPayable - totalPaidNow;
  
  let newStatus = invoice.status;
  if (newBalance <= 0) {
    newStatus = 'PAID';
  } else if (totalPaidNow > 0) {
    newStatus = 'PARTIAL';
  }

  // 1. Create Payment Record
  const newPayment = {
    paymentId,
    schoolId,
    invoiceId: invoice.id,
    studentId: invoice.studentId,
    paidAmount: paidAmt,
    paymentDate: serverTimestamp(),
    paymentMethod: paymentDetails.paymentMethod || 'CASH',
    receiptNumber: `REC-${Date.now()}`,
    remarks: paymentDetails.remarks || '',
    createdAt: serverTimestamp(),
  };
  batch.set(paymentRef, newPayment);

  // 2. Update Invoice
  const invoiceRef = doc(db, INVOICES_COL, invoice.id);
  batch.update(invoiceRef, {
    discount: discountAmt,
    fine: fineAmt,
    payableAmount: newPayable,
    paidAmount: totalPaidNow,
    remainingBalance: newBalance,
    status: newStatus,
  });

  // 3. Update Ledger
  const ledgerId = `ledg_pay_${paymentId}`;
  const ledgerRef = doc(db, LEDGERS_COL, ledgerId);
  batch.set(ledgerRef, {
    ledgerId,
    schoolId,
    studentId: invoice.studentId,
    date: serverTimestamp(),
    transactionType: 'PAYMENT',
    description: `Payment for Invoice ${invoice.invoiceNumber} (${paymentDetails.paymentMethod})`,
    debit: 0,
    credit: paidAmt,
    invoiceId: invoice.id,
  });

  if (discountAmt > invoice.discount) {
    const diff = discountAmt - invoice.discount;
    const lId = `ledg_disc_${paymentId}`;
    batch.set(doc(db, LEDGERS_COL, lId), {
      ledgerId: lId, schoolId, studentId: invoice.studentId, date: serverTimestamp(),
      transactionType: 'DISCOUNT', description: `Discount applied to Invoice ${invoice.invoiceNumber}`,
      debit: 0, credit: diff, invoiceId: invoice.id,
    });
  }

  if (fineAmt > invoice.fine) {
    const diff = fineAmt - invoice.fine;
    const lId = `ledg_fine_${paymentId}`;
    batch.set(doc(db, LEDGERS_COL, lId), {
      ledgerId: lId, schoolId, studentId: invoice.studentId, date: serverTimestamp(),
      transactionType: 'FINE', description: `Fine added to Invoice ${invoice.invoiceNumber}`,
      debit: diff, credit: 0, invoiceId: invoice.id,
    });
  }

  await batch.commit();
  return { id: paymentId, ...newPayment };
}

export async function getStudentLedger(schoolId, studentId) {
  try {
    const q = query(
      collection(db, LEDGERS_COL),
      where('schoolId', '==', schoolId),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);
    const items = [];
    snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
    
    // Sort asc by date for running balance calculation
    items.sort((a, b) => {
      const tA = a.date?.toMillis?.() || 0;
      const tB = b.date?.toMillis?.() || 0;
      return tA - tB;
    });

    let runningBalance = 0;
    const ledgersWithBalance = items.map(item => {
      runningBalance = runningBalance + (item.debit || 0) - (item.credit || 0);
      return { ...item, runningBalance };
    });

    // Reverse so newest is first for display
    return ledgersWithBalance.reverse();
  } catch (error) {
    console.error('Error fetching ledger:', error);
    return [];
  }
}

// ----------------------------------------------------------------------
// DASHBOARD STATS
// ----------------------------------------------------------------------

export async function getPendingFees(schoolId) {
  try {
    const q = query(collection(db, INVOICES_COL), where('schoolId', '==', schoolId));
    const snapshot = await getDocs(q);
    let total = 0;
    snapshot.forEach(d => {
      const inv = d.data();
      if (inv.status !== 'PAID') {
        total += (inv.remainingBalance || 0);
      }
    });
    return total;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function getMonthlyCollection(schoolId) {
  try {
    // Current month check
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    const q = query(collection(db, PAYMENTS_COL), where('schoolId', '==', schoolId));
    const snapshot = await getDocs(q);
    
    let total = 0;
    snapshot.forEach(d => {
      const p = d.data();
      const pTime = p.paymentDate?.toMillis?.() || 0;
      if (pTime >= currentMonthStart) {
        total += (p.paidAmount || 0);
      }
    });
    return total;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

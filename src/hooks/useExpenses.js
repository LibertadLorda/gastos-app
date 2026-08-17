import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

export function useExpenses(groupId) {
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;

    // Expenses that are not deleted (deletedAt === null)
    const qExpenses = query(
      collection(db, "groups", groupId, "expenses"),
      // only items with deletedAt explicitly null are considered "active"
      // add index in Firestore if prompted
      // Note: addExpense sets deletedAt: null for new documents
      where("deletedAt", "==", null),
      orderBy("createdAt", "desc")
    );

    // Payments listener
    const qPayments = query(
      collection(db, "groups", groupId, "payments"),
      orderBy("createdAt", "desc")
    );

    // Trash: items with a deletedAt timestamp
    const qTrash = query(
      collection(db, "groups", groupId, "expenses"),
      where("deletedAt", ">", new Date(0)),
      orderBy("deletedAt", "desc")
    );

    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setExpenses(data);
      setLoading(false);
    });

    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPayments(data);
    });

    const unsubTrash = onSnapshot(qTrash, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTrash(data);
    });

    return () => {
      unsubExpenses();
      unsubPayments();
      unsubTrash();
    };
  }, [groupId]);

  async function addExpense({ description, amount, category, isShared, sharedWith, date, paidBy, paidByName, splitType }) {
    await addDoc(collection(db, "groups", groupId, "expenses"), {
      description,
      amount: parseFloat(amount),
      category,
      isShared,
      sharedWith: isShared ? sharedWith : [paidBy],
      splitType: splitType || "equal",
      paidBy,
      paidByName,
      date,
      createdAt: new Date(),
      deletedAt: null,
    });
  }

  async function editExpense(expenseId, { description, amount, category, isShared, sharedWith, date, paidBy, paidByName, splitType }) {
    const ref = doc(db, "groups", groupId, "expenses", expenseId);
    await updateDoc(ref, {
      description,
      amount: parseFloat(amount),
      category,
      isShared,
      sharedWith: isShared ? sharedWith : [paidBy],
      splitType: splitType || "equal",
      paidBy,
      paidByName,
      date,
    });
  }

  // Soft-delete: mark deletedAt so it moves to the trash
  async function deleteExpense(expenseId) {
    const ref = doc(db, "groups", groupId, "expenses", expenseId);
    await updateDoc(ref, { deletedAt: new Date() });
  }

  async function restoreExpense(expenseId) {
    const ref = doc(db, "groups", groupId, "expenses", expenseId);
    await updateDoc(ref, { deletedAt: null });
  }

  async function permanentlyDeleteExpense(expenseId) {
    const ref = doc(db, "groups", groupId, "expenses", expenseId);
    await deleteDoc(ref);
  }

  async function emptyTrash() {
    // Delete each trashed document
    const deletes = trash.map((t) => deleteDoc(doc(db, "groups", groupId, "expenses", t.id)));
    await Promise.all(deletes);
  }

  async function registerPayment({ fromUid, fromName, toUid, toName, amount }) {
    await addDoc(collection(db, "groups", groupId, "payments"), {
      fromUid,
      fromName,
      toUid,
      toName,
      amount: parseFloat(amount),
      createdAt: new Date(),
    });
  }

  return { expenses, payments, trash, loading, addExpense, editExpense, deleteExpense, registerPayment, restoreExpense, permanentlyDeleteExpense, emptyTrash };
}
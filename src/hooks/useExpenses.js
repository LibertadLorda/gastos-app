import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
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

    // Listen all expenses and split client-side into active and trash.
    // This avoids excluding documents that don't have deletedAt field and
    // prevents requiring additional Firestore indexes.
    const qAllExpenses = query(
      collection(db, "groups", groupId, "expenses"),
      orderBy("createdAt", "desc")
    );

    const qPayments = query(
      collection(db, "groups", groupId, "payments"),
      orderBy("createdAt", "desc")
    );

    const unsubExpenses = onSnapshot(qAllExpenses, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Consider an item trashed if deletedAt is present (truthy). It may be a
      // Firestore Timestamp or JS Date string; checking existence is enough.
      setTrash(data.filter((item) => !!item.deletedAt));
      setExpenses(data.filter((item) => !item.deletedAt));
      setLoading(false);
    });

    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPayments(data);
    });

    return () => {
      unsubExpenses();
      unsubPayments();
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
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;

    const qExpenses = query(
      collection(db, "groups", groupId, "expenses"),
      orderBy("createdAt", "desc")
    );

    const qPayments = query(
      collection(db, "groups", groupId, "payments"),
      orderBy("createdAt", "desc")
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

  async function deleteExpense(expenseId) {
    const ref = doc(db, "groups", groupId, "expenses", expenseId);
    await deleteDoc(ref);
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

  return { expenses, payments, loading, addExpense, editExpense, deleteExpense, registerPayment };
}
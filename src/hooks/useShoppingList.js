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
import { useAuth } from "./useAuth";

export function useShoppingList(groupId) {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;

    const q = query(
      collection(db, "groups", groupId, "shoppingList"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [groupId]);

  async function addItem(name) {
    await addDoc(collection(db, "groups", groupId, "shoppingList"), {
      name,
      checked: false,
      addedBy: currentUser.displayName,
      createdAt: new Date(),
    });
  }

  async function toggleItem(itemId, checked) {
    const ref = doc(db, "groups", groupId, "shoppingList", itemId);
    await updateDoc(ref, { checked: !checked });
  }

  async function deleteItem(itemId) {
    const ref = doc(db, "groups", groupId, "shoppingList", itemId);
    await deleteDoc(ref);
  }

  return { items, loading, addItem, toggleItem, deleteItem };
}
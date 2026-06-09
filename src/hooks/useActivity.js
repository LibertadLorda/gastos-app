import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/config";

export function useActivity(groupId) {
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (!groupId) return;

    const q = query(
      collection(db, "groups", groupId, "activity"),
      orderBy("createdAt", "desc"),
      limit(25)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setActivity(data);
    });

    return unsubscribe;
  }, [groupId]);

  async function logActivity({ type, description, userName }) {
    await addDoc(collection(db, "groups", groupId, "activity"), {
      type,
      description,
      userName,
      createdAt: new Date(),
    });

    const q = query(
      collection(db, "groups", groupId, "activity"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    if (snapshot.docs.length > 50) {
      const toDelete = snapshot.docs.slice(50);
      await Promise.all(
        toDelete.map((d) => deleteDoc(doc(db, "groups", groupId, "activity", d.id)))
      );
    }
  }

  return { activity, logActivity };
}
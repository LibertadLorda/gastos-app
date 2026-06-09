import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export function useGroups() {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroups(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  async function createGroup(name) {
    await addDoc(collection(db, "groups"), {
      name,
      createdBy: currentUser.uid,
      members: [currentUser.uid],
      memberNames: { [currentUser.uid]: currentUser.displayName },
      createdAt: new Date(),
    });
  }

  async function joinGroup(groupId) {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(currentUser.uid),
      [`memberNames.${currentUser.uid}`]: currentUser.displayName,
    });
  }

  return { groups, loading, createGroup, joinGroup };
}
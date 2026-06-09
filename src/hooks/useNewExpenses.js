import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { getLastVisit } from "./useLastVisit";

export function useNewExpenses(groups, currentUserId) {
  const [newCounts, setNewCounts] = useState({});

  useEffect(() => {
    if (!groups || groups.length === 0) return;

    const unsubs = groups.map((group) => {
      const q = query(
        collection(db, "groups", group.id, "expenses"),
        orderBy("createdAt", "desc")
      );

      return onSnapshot(q, (snapshot) => {
        const lastVisit = getLastVisit(group.id);

        const count = snapshot.docs.filter((d) => {
          const data = d.data();
          const createdAt = data.createdAt?.toDate?.();
          if (!createdAt) return false;

          // No contar gastos propios
          if (data.paidBy === currentUserId) return false;

          // Solo contar gastos visibles para este usuario
          const isVisible = data.isShared && data.sharedWith?.includes(currentUserId);
          if (!isVisible) return false;

          if (!lastVisit) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return createdAt > sevenDaysAgo;
          }
          return createdAt > lastVisit;
        }).length;

        setNewCounts((prev) => ({ ...prev, [group.id]: count }));
      });
    });

    return () => unsubs.forEach((u) => u());
  }, [groups, currentUserId]);

  return { newCounts };
}
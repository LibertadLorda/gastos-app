export function calculateBalances(expenses, payments) {
  const net = {};

  function ensureKey(a, b) {
    const key = [a, b].sort().join("_");
    if (!net[key]) net[key] = { uids: [a, b].sort(), amount: 0 };
    return key;
  }

  expenses.forEach((expense) => {
    if (!expense.isShared) return;
    const { paidBy, amount, sharedWith } = expense;
    if (!sharedWith || sharedWith.length === 0) return;

    const share = amount / sharedWith.length;

    sharedWith.forEach((uid) => {
      if (uid === paidBy) return;
      const key = ensureKey(paidBy, uid);
      if (net[key].uids[0] === paidBy) {
        net[key].amount += share;
      } else {
        net[key].amount -= share;
      }
    });
  });

  (payments || []).forEach((payment) => {
    const { fromUid, toUid, amount } = payment;
    const key = ensureKey(toUid, fromUid);
    if (net[key].uids[0] === toUid) {
      net[key].amount -= amount;
    } else {
      net[key].amount += amount;
    }
  });

  const result = [];
  Object.values(net).forEach((entry) => {
    const [a, b] = entry.uids;
    if (entry.amount > 0.01) {
      result.push({ from: b, to: a, amount: entry.amount });
    } else if (entry.amount < -0.01) {
      result.push({ from: a, to: b, amount: Math.abs(entry.amount) });
    }
  });

  return result;
}
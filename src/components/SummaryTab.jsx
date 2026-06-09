import { useState } from "react";
import { useExpenses } from "../hooks/useExpenses";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function SummaryTab({ group }) {
  const { expenses, loading } = useExpenses(group.id);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const years = [...new Set(expenses.map((e) => {
    const d = e.date ? new Date(e.date) : e.createdAt?.toDate?.();
    return d ? d.getFullYear() : now.getFullYear();
  }))].sort((a, b) => b - a);

  if (!years.includes(selectedYear) && years.length > 0) {
    years.push(selectedYear);
    years.sort((a, b) => b - a);
  }

  const filtered = expenses.filter((e) => {
    const d = e.date ? new Date(e.date + "T00:00:00") : e.createdAt?.toDate?.();
    if (!d) return false;
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalMonth = filtered.reduce((sum, e) => sum + e.amount, 0);

  const byMember = {};
  Object.entries(group.memberNames).forEach(([uid, name]) => {
    if (name) byMember[uid] = { name, paid: 0, share: 0 };
  });

  filtered.forEach((expense) => {
    if (byMember[expense.paidBy]) {
      byMember[expense.paidBy].paid += expense.amount;
    }
    if (expense.isShared && expense.sharedWith?.length > 0) {
      const share = expense.amount / expense.sharedWith.length;
      expense.sharedWith.forEach((uid) => {
        if (byMember[uid]) byMember[uid].share += share;
      });
    } else {
      if (byMember[expense.paidBy]) {
        byMember[expense.paidBy].share += expense.amount;
      }
    }
  });

  const byCategory = {};
  filtered.forEach((e) => {
    if (!byCategory[e.category]) byCategory[e.category] = 0;
    byCategory[e.category] += e.amount;
  });
  const categoriesSorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="w-24 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm italic">No hay gastos en este periodo</p>
      ) : (
        <>
          <div className="bg-indigo-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total {MONTHS[selectedMonth]} {selectedYear}</p>
            <p className="text-3xl font-bold mt-1">{totalMonth.toFixed(2)}€</p>
            <p className="text-sm opacity-80 mt-1">{filtered.length} gastos</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-3">Por miembro</h4>
            <ul className="space-y-3">
              {Object.values(byMember)
                .filter((m) => m.paid > 0 || m.share > 0)
                .sort((a, b) => b.paid - a.paid)
                .map((member) => (
                  <li key={member.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{member.name}</span>
                      <span className="text-sm font-bold text-gray-800">{member.paid.toFixed(2)}€ pagado</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: totalMonth > 0 ? `${(member.paid / totalMonth) * 100}%` : "0%" }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Le corresponde: {member.share.toFixed(2)}€
                    </p>
                  </li>
                ))}
            </ul>
          </div>

          {categoriesSorted.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h4 className="font-semibold text-gray-700 text-sm mb-3">Por categoría</h4>
              <ul className="space-y-3">
                {categoriesSorted.map(([category, amount]) => (
                  <li key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{category}</span>
                      <span className="text-sm font-semibold text-gray-800">{amount.toFixed(2)}€</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-purple-400 h-1.5 rounded-full"
                        style={{ width: `${(amount / totalMonth) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {((amount / totalMonth) * 100).toFixed(0)}% del total
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
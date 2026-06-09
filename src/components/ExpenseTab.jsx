import { useState } from "react";
import { useExpenses } from "../hooks/useExpenses";
import { useAuth } from "../hooks/useAuth";
import { formatDate, formatSimpleDate } from "../utils/formatDate";
import { getLastVisit } from "../hooks/useLastVisit";
import { useActivity } from "../hooks/useActivity";

const CATEGORIES = [
  "Comida", "Transporte", "Alojamiento", "Ocio", "Supermercado", "Compras", "Otros"
];

function ExpenseForm({ group, currentUser, today, onSave, onCancel, initial }) {
  const [description, setDescription] = useState(initial?.description || "");
  const [amount, setAmount] = useState(initial?.amount || "");
  const [category, setCategory] = useState(initial?.category || "Otros");
  const [isShared, setIsShared] = useState(initial?.isShared ?? true);
  const [sharedWith, setSharedWith] = useState(
    initial?.sharedWith || Object.keys(group.memberNames)
  );
  const [date, setDate] = useState(initial?.date || today);
  const [paidBy, setPaidBy] = useState(initial?.paidBy || currentUser.uid);
  const [paidByName, setPaidByName] = useState(initial?.paidByName || currentUser.displayName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleMember(uid) {
    setSharedWith((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    setSaving(true);
    setError("");
    try {
      await onSave({ description, amount, category, isShared, sharedWith, date, paidBy, paidByName });
    } catch {
      setError("Error al guardar el gasto");
      setSaving(false);
    }
  }

  return (
    <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Ej: Cena del viernes"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Importe (€)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">¿Quién pagó?</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(group.memberNames)
              .filter(([, name]) => name)
              .map(([uid, name]) => (
                <button
                  key={uid}
                  type="button"
                  onClick={() => {
                    setPaidBy(uid);
                    setPaidByName(name);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${paidBy === uid
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-500 border-gray-200"
                    }`}
                >
                  {uid === currentUser.uid ? "Yo" : name}
                </button>
              ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isShared"
            checked={isShared}
            onChange={(e) => {
              setIsShared(e.target.checked);
              if (e.target.checked) {
                setSharedWith(Object.keys(group.memberNames));
              } else {
                setSharedWith([paidBy]);
              }
            }}
            className="w-4 h-4 accent-indigo-600"
          />
          <label htmlFor="isShared" className="text-sm text-gray-600">
            Gasto compartido
          </label>
        </div>

        {isShared && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Compartir con
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(group.memberNames)
                .filter(([, name]) => name)
                .map(([uid, name]) => (
                  <button
                    key={uid}
                    type="button"
                    onClick={() => toggleMember(uid)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${sharedWith.includes(uid)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-500 border-gray-200"
                      }`}
                  >
                    {uid === currentUser.uid ? "Yo" : name}
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            {saving ? "Guardando..." : "Guardar gasto"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors bg-white"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ExpenseTab({ group }) {
  const { currentUser } = useAuth();
  const { expenses, loading, addExpense, editExpense, deleteExpense } = useExpenses(group.id);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const today = new Date().toISOString().split("T")[0];

  const lastVisit = getLastVisit(group.id);
  const { logActivity } = useActivity(group.id);

  function isNew(expense) {
    if (expense.paidBy === currentUser.uid) return false;
    const createdAt = expense.createdAt?.toDate?.();
    if (!createdAt) return false;
    if (!lastVisit) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return createdAt > sevenDaysAgo;
    }
    return createdAt > lastVisit;
  }

  function getMemberName(uid) {
    return group.memberNames[uid] || uid;
  }

  const filtered = expenses.filter((e) => {
    const isVisible = e.paidBy === currentUser.uid ||
      (e.isShared && e.sharedWith?.includes(currentUser.uid));
    return isVisible && e.description.toLowerCase().includes(search.toLowerCase());
  });

  const filteredAndSorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "date-desc": {
        const dateA = a.date || a.createdAt?.toDate?.()?.toISOString?.().split("T")[0] || "";
        const dateB = b.date || b.createdAt?.toDate?.()?.toISOString?.().split("T")[0] || "";
        return dateB.localeCompare(dateA);
      }
      case "date-asc": {
        const dateA = a.date || a.createdAt?.toDate?.()?.toISOString?.().split("T")[0] || "";
        const dateB = b.date || b.createdAt?.toDate?.()?.toISOString?.().split("T")[0] || "";
        return dateA.localeCompare(dateB);
      }
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  async function handleAdd(data) {
    await addExpense(data);
    await logActivity({
      type: "add_expense",
      description: `Añadió el gasto "${data.description}" de ${parseFloat(data.amount).toFixed(2)}€`,
      userName: currentUser.displayName,
    });
    setShowForm(false);
  }

  async function handleEdit(expenseId, data) {
    await editExpense(expenseId, data);
    await logActivity({
      type: "edit_expense",
      description: `Editó el gasto "${data.description}"`,
      userName: currentUser.displayName,
    });
    setEditingId(null);
  }

  async function handleDelete(expenseId) {
    const expense = expenses.find((e) => e.id === expenseId);
    await deleteExpense(expenseId);
    await logActivity({
      type: "delete_expense",
      description: `Eliminó el gasto "${expense?.description || ""}"`,
      userName: currentUser.displayName,
    });
    setConfirmDelete(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">Gastos</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Añadir gasto
          </button>
        )}
      </div>

      {showForm && (
        <ExpenseForm
          group={group}
          currentUser={currentUser}
          today={today}
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar gasto..."
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
        />
        <div className="flex gap-2">
          {[
            { value: "date-desc", label: "Fecha ↓" },
            { value: "date-asc", label: "Fecha ↑" },
            { value: "amount-desc", label: "Mayor €" },
            { value: "amount-asc", label: "Menor €" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${sortBy === option.value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : filteredAndSorted.length === 0 ? (
        <p className="text-gray-400 text-sm italic">
          {search ? "No hay resultados" : "No hay gastos todavía"}
        </p>
      ) : (
        <ul className="space-y-2">
          {filteredAndSorted.map((expense) => (
            <li key={expense.id}>
              {editingId === expense.id ? (
                <ExpenseForm
                  group={group}
                  currentUser={currentUser}
                  today={today}
                  initial={expense}
                  onSave={(data) => handleEdit(expense.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className={`p-4 rounded-xl border ${isNew(expense)
                    ? "bg-indigo-50 border-indigo-200"
                    : "bg-white border-gray-100"
                  }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{expense.description}</p>
                        {isNew(expense) && (
                          <span className="text-xs bg-indigo-600 text-white rounded-full px-1.5 py-0.5 shrink-0">
                            Nuevo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {expense.paidByName} · {expense.category} ·{" "}
                        {expense.date ? formatSimpleDate(expense.date) : formatDate(expense.createdAt)}
                      </p>
                      {expense.isShared && expense.sharedWith?.length > 0 && (
                        <p className="text-xs text-indigo-400 mt-0.5">
                          Compartido con{" "}
                          {expense.sharedWith
                            .filter((uid) => uid !== expense.paidBy)
                            .map((uid) => getMemberName(uid))
                            .join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-800">{expense.amount.toFixed(2)}€</p>
                      {(
                        <div className="flex gap-2 justify-end mt-1">
                          <button
                            onClick={() => setEditingId(expense.id)}
                            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(expense.id)}
                            className="text-xs text-red-400 hover:text-red-600 font-medium"
                          >
                            Borrar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {confirmDelete === expense.id && (
                    <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-600 flex-1">¿Seguro que quieres borrar este gasto?</p>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                      >
                        Borrar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
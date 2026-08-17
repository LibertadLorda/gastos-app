import { useState } from "react";
import { useExpenses } from "../hooks/useExpenses";
import { useActivity } from "../hooks/useActivity";
import { useAuth } from "../hooks/useAuth";
import { formatSimpleDate } from "../utils/formatDate";

const CATEGORY_COLORS = {
  Comida: "bg-green-100 text-green-700",
  Supermercado: "bg-emerald-100 text-emerald-700",
  Gasolina: "bg-blue-100 text-blue-700",
  Alojamiento: "bg-purple-100 text-purple-700",
  Servicios: "bg-indigo-100 text-indigo-700",
  Salud: "bg-rose-100 text-rose-700",
  Ocio: "bg-yellow-100 text-yellow-700",
  Compras: "bg-pink-100 text-pink-700",
  Gatos: "bg-stone-100 text-stone-700",
  Otros: "bg-gray-100 text-gray-600",
};

function daysLeft(deletedAt) {
  const deleted = deletedAt?.toDate?.() || new Date(deletedAt);
  const diff = 30 - Math.floor((Date.now() - deleted.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function deletedOnLabel(deletedAt) {
  const deleted = deletedAt?.toDate?.() || new Date(deletedAt);
  return deleted.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default function TrashTab({ group }) {
  const { currentUser } = useAuth();
  const { trash, restoreExpense, permanentlyDeleteExpense, emptyTrash } = useExpenses(group.id);
  const { logActivity } = useActivity(group.id);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmPermDel, setConfirmPermDel] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  async function handleRestore(item) {
    setLoadingId(item.id);
    try {
      await restoreExpense(item.id);
      await logActivity({
        type: "restore_expense",
        description: `Restauró el gasto "${item.description}" de ${item.amount.toFixed(2)}€`,
        userName: currentUser.displayName,
      });
    } finally {
      setLoadingId(null);
    }
  }

  async function handlePermDel(item) {
    setLoadingId(item.id);
    try {
      await permanentlyDeleteExpense(item.id);
      await logActivity({
        type: "delete_expense_permanent",
        description: `Eliminó definitivamente el gasto "${item.description}"`,
        userName: currentUser.displayName,
      });
    } finally {
      setLoadingId(null);
      setConfirmPermDel(null);
    }
  }

  async function handleEmptyTrash() {
    await emptyTrash();
    await logActivity({
      type: "empty_trash",
      description: `Vació la papelera de gastos`,
      userName: currentUser.displayName,
    });
    setConfirmEmpty(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-700">Papelera de gastos</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Los gastos eliminados se guardan 30 días. Puedes restaurarlos antes de que desaparezcan.
          </p>
        </div>
        {trash.length > 0 && (
          <button
            onClick={() => setConfirmEmpty(true)}
            className="text-xs text-red-400 hover:text-red-600 font-medium border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            Vaciar
          </button>
        )}
      </div>

      {confirmEmpty && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <p className="text-sm text-red-700 flex-1">
            ¿Vaciar toda la papelera? Los gastos se perderán para siempre.
          </p>
          <button
            onClick={handleEmptyTrash}
            className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Vaciar
          </button>
          <button
            onClick={() => setConfirmEmpty(false)}
            className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
          >
            Cancelar
          </button>
        </div>
      )}

      {trash.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3 opacity-40">🗑️</div>
          <p className="text-sm">La papelera está vacía</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {trash.map((item) => {
            const days = daysLeft(item.deletedAt);
            const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS["Otros"];
            return (
              <li key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 opacity-80">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-700 text-sm">{item.description}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Pagado por {item.paidByName}
                      {item.date && ` · ${formatSimpleDate(item.date)}`}
                    </p>
                    <p className="text-xs mt-1">
                      <span className="text-gray-400">Eliminado el {deletedOnLabel(item.deletedAt)} · </span>
                      <span className={days <= 5 ? "text-red-500 font-medium" : "text-amber-500"}>
                        {days === 0
                          ? "Se elimina hoy"
                          : `${days} día${days !== 1 ? "s" : ""} restante${days !== 1 ? "s" : ""}`}
                      </span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-700">{item.amount.toFixed(2)}€</p>
                  </div>
                </div>

                {confirmPermDel === item.id ? (
                  <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-600 flex-1">¿Borrar definitivamente?</p>
                    <button
                      onClick={() => handlePermDel(item)}
                      disabled={loadingId === item.id}
                      className="text-xs bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                    >
                      {loadingId === item.id ? "…" : "Borrar"}
                    </button>
                    <button
                      onClick={() => setConfirmPermDel(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleRestore(item)}
                      disabled={loadingId === item.id}
                      className="flex-1 text-xs bg-indigo-50 hover:bg-indigo-100 disabled:opacity-60 text-indigo-600 font-semibold py-2 rounded-lg transition-colors border border-indigo-100"
                    >
                      {loadingId === item.id ? "Restaurando…" : "↩ Restaurar"}
                    </button>
                    <button
                      onClick={() => setConfirmPermDel(item.id)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium px-3 py-2 rounded-lg border border-red-100 hover:border-red-300 transition-colors"
                    >
                      Borrar definitivamente
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
import { useState } from "react";
import { useExpenses } from "../hooks/useExpenses";
import { useAuth } from "../hooks/useAuth";
import { calculateBalances } from "../utils/balance";
import { formatDate } from "../utils/formatDate";

export default function BalanceTab({ group }) {
  const { currentUser } = useAuth();
  const { expenses, payments, loading, registerPayment } = useExpenses(group.id);
  const [payingTo, setPayingTo] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const balances = calculateBalances(expenses, payments);
  const myDebts = balances.filter((b) => b.from === currentUser.uid);
  const owedToMe = balances.filter((b) => b.to === currentUser.uid);

  function getName(uid) {
    return group.memberNames[uid] || uid;
  }

  async function handlePay(debt) {
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    setSaving(true);
    setError("");
    try {
      await registerPayment({
        fromUid: currentUser.uid,
        fromName: currentUser.displayName,
        toUid: debt.to,
        toName: getName(debt.to),
        amount: parseFloat(payAmount),
      });
      setPayingTo(null);
      setPayAmount("");
    } catch {
      setError("Error al registrar el pago");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 text-red-500 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {owedToMe.length > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <h4 className="font-semibold text-green-700 mb-3">Te deben</h4>
              <ul className="space-y-2">
                {owedToMe.map((b, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      <span className="font-medium">{getName(b.from)}</span> te debe
                    </span>
                    <span className="font-bold text-green-600">{b.amount.toFixed(2)}€</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {myDebts.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <h4 className="font-semibold text-red-700 mb-3">Debes</h4>
              <ul className="space-y-3">
                {myDebts.map((b, i) => (
                  <li key={i}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        Debes a <span className="font-medium">{getName(b.to)}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-500">{b.amount.toFixed(2)}€</span>
                        <button
                          onClick={() => {
                            setPayingTo(b);
                            setPayAmount(b.amount.toFixed(2));
                          }}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Pagar
                        </button>
                      </div>
                    </div>

                    {payingTo && payingTo.to === b.to && (
                      <div className="mt-2 flex gap-2 items-center">
                        <input
                          type="number"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          min="0.01"
                          step="0.01"
                          max={b.amount.toFixed(2)}
                          className="w-28 px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                        />
                        <span className="text-sm text-gray-400">€</span>
                        <button
                          onClick={() => handlePay(b)}
                          disabled={saving}
                          className="text-xs bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {saving ? "..." : "Confirmar"}
                        </button>
                        <button
                          onClick={() => setPayingTo(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {owedToMe.length === 0 && myDebts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-gray-500 text-sm">Estás al día con todos</p>
            </div>
          )}

          {payments.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3">Historial de pagos</h4>
              <ul className="space-y-2">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-600">
                        <span className="font-medium">{payment.fromName}</span> pagó a{" "}
                        <span className="font-medium">{payment.toName}</span>
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(payment.createdAt)}</p>
                    </div>
                    <span className="font-semibold text-gray-800">{payment.amount.toFixed(2)}€</span>
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
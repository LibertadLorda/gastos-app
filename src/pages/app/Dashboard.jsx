import { useState } from "react";
import { useGroups } from "../../hooks/useGroups";
import { useAuth } from "../../hooks/useAuth";
import ExpenseTab from "../../components/ExpenseTab";
import BalanceTab from "../../components/BalanceTab";
import ShoppingTab from "../../components/ShoppingTab";

const TABS = [
  { id: "expenses", label: "💸 Gastos" },
  { id: "balance", label: "⚖️ Balance" },
  { id: "shopping", label: "🛒 Lista" },
];

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { groups, loading, createGroup, joinGroup } = useGroups();
  const [newGroupName, setNewGroupName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [error, setError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("expenses");
  const [copiedId, setCopiedId] = useState(null);

  function handleCopy(e, groupId) {
    e.stopPropagation();
    navigator.clipboard.writeText(groupId);
    setCopiedId(groupId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setError("");
    try {
      await createGroup(newGroupName.trim());
      setNewGroupName("");
    } catch {
      setError("Error al crear el grupo");
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinId.trim()) return;
    setError("");
    try {
      await joinGroup(joinId.trim());
      setJoinId("");
    } catch {
      setError("No se encontró el grupo o ya eres miembro");
    }
  }

  if (selectedGroup) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSelectedGroup(null)}
              className="text-indigo-600 font-semibold text-sm shrink-0"
            >
              ← Volver
            </button>
            <span className="font-bold text-gray-800 truncate">{selectedGroup.name}</span>
          </div>
          <span className="text-xs text-gray-400 shrink-0 ml-2">
            {selectedGroup.members.length} miembros
          </span>
        </header>

        <div className="max-w-lg mx-auto">
          <div className="flex border-b border-gray-200 bg-white sticky top-[61px] z-10">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 pb-10">
            {activeTab === "expenses" && <ExpenseTab group={selectedGroup} />}
            {activeTab === "balance" && <BalanceTab group={selectedGroup} />}
            {activeTab === "shopping" && <ShoppingTab group={selectedGroup} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💸</span>
          <span className="font-bold text-gray-800 text-lg">GastosApp</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{currentUser.displayName}</span>
          <button
            onClick={logout}
            className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-3">Crear grupo</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nombre del grupo"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Crear
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-3">Unirse a grupo</h3>
            <form onSubmit={handleJoin} className="flex flex-col gap-2">
              <input
                type="text"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="ID del grupo"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Unirse
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Tus grupos</h3>
          {loading ? (
            <p className="text-gray-400 text-sm">Cargando...</p>
          ) : groups.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No tienes grupos todavía</p>
          ) : (
            <ul className="space-y-2">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="p-4 rounded-xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <p className="font-semibold text-gray-800">{group.name}</p>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-1 shrink-0 ml-2">
                      {group.members.length} {group.members.length === 1 ? "miembro" : "miembros"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-xs text-gray-400 font-mono truncate">{group.id}</p>
                    <button
                      onClick={(e) => handleCopy(e, group.id)}
                      className={`text-xs font-medium shrink-0 transition-colors ${copiedId === group.id
                          ? "text-green-500"
                          : "text-indigo-500 hover:text-indigo-700"
                        }`}
                    >
                      {copiedId === group.id ? "¡Copiado!" : "Copiar ID"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
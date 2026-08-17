import { useState } from "react";
import { useGroups } from "../../hooks/useGroups";
import { useAuth } from "../../hooks/useAuth";
import { setLastVisit } from "../../hooks/useLastVisit";
import { useNewExpenses } from "../../hooks/useNewExpenses";
import ExpenseTab from "../../components/ExpenseTab";
import BalanceTab from "../../components/BalanceTab";
import ShoppingTab from "../../components/ShoppingTab";
import SummaryTab from "../../components/SummaryTab";
import ActivityTab from "../../components/ActivityTab";
import TrashTab from "../../components/TrashTab";
import Profile from "./Profile";
import WelcomeModal from "../../components/WelcomeModal";

const TABS = [
  { id: "expenses", label: "💸 Gastos" },
  { id: "balance", label: "⚖️ Balance" },
  { id: "shopping", label: "🛒 Lista" },
  { id: "summary", label: "📊 Resumen" },
  { id: "activity", label: "📋 Actividad" },
  { id: "trash", label: "🗑️ Papelera" },
];

const GROUP_COLORS = [
  "#4f46e5", "#7c3aed", "#db2777", "#dc2626",
  "#d97706", "#16a34a", "#0891b2", "#374151",
];

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { groups, loading, createGroup, joinGroup, leaveGroup, updateGroupColor } = useGroups();
  const { newCounts } = useNewExpenses(groups, currentUser.uid);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#4f46e5");
  const [joinId, setJoinId] = useState("");
  const [error, setError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("expenses");
  const [copiedId, setCopiedId] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem(`welcomed_${currentUser.uid}`);
  });

  function handleCloseWelcome() {
    localStorage.setItem(`welcomed_${currentUser.uid}`, "true");
    setShowWelcome(false);
  }

  function handleSelectGroup(group) {
    setSelectedGroup(group);
    setActiveTab("expenses");
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setError("");
    try {
      await createGroup(newGroupName.trim(), newGroupColor);
      setNewGroupName("");
      setNewGroupColor("#4f46e5");
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

  async function handleLeave() {
    try {
      await leaveGroup(selectedGroup.id);
      setSelectedGroup(null);
      setConfirmLeave(false);
    } catch {
      setError("Error al abandonar el grupo");
    }
  }

  async function handleColorChange(color) {
    try {
      await updateGroupColor(selectedGroup.id, color);
      setSelectedGroup((prev) => ({ ...prev, color }));
    } catch {
      setError("Error al cambiar el color");
    }
  }

  function handleCopy(e, groupId) {
    e.stopPropagation();
    navigator.clipboard.writeText(groupId);
    setCopiedId(groupId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (showProfile) {
    return <Profile onBack={() => setShowProfile(false)} />;
  }

  if (selectedGroup) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header
          className="px-4 py-3 flex items-center justify-between sticky top-0 z-10"
          style={{ backgroundColor: selectedGroup.color || "#4f46e5" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                setLastVisit(selectedGroup.id);
                setSelectedGroup(null);
                setShowMembers(false);
                setConfirmLeave(false);
              }}
              className="text-white font-semibold text-sm shrink-0"
            >
              ← Volver
            </button>
            <span className="font-bold text-white truncate">{selectedGroup.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="text-white text-xs font-medium bg-white/20 rounded-full px-3 py-1"
            >
              {selectedGroup.members.length} miembros
            </button>
            <button
              onClick={logout}
              className="text-white text-xs font-medium bg-white/20 rounded-full px-3 py-1"
            >
              Salir
            </button>
          </div>
        </header>

        {showMembers && (
          <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Miembros</p>
              <ul className="space-y-1">
                {Object.entries(selectedGroup.memberNames)
                  .filter(([, name]) => name)
                  .map(([uid, name]) => (
                    <li key={uid} className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: selectedGroup.color || "#4f46e5" }}
                      >
                        {name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700">{name}</span>
                      {uid === currentUser.uid && (
                        <span className="text-xs text-gray-400">(tú)</span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Color del grupo</p>
              <div className="flex gap-2 flex-wrap">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      (selectedGroup.color || "#4f46e5") === color
                        ? "scale-125 ring-2 ring-offset-1 ring-gray-400"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-1">
              {!confirmLeave ? (
                <button
                  onClick={() => setConfirmLeave(true)}
                  className="text-sm text-red-500 font-medium"
                >
                  Abandonar grupo
                </button>
              ) : (
                <div className="flex items-center gap-3 bg-red-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-red-600 flex-1">¿Seguro que quieres salir?</p>
                  <button
                    onClick={handleLeave}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded-lg"
                  >
                    Salir
                  </button>
                  <button
                    onClick={() => setConfirmLeave(false)}
                    className="text-xs text-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="max-w-lg mx-auto">
          <div className="flex border-b border-gray-200 bg-white sticky top-[49px] z-10 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-xs font-medium transition-colors whitespace-nowrap px-1 ${
                  activeTab === tab.id
                    ? "border-b-2 text-indigo-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                style={
                  activeTab === tab.id
                    ? { borderBottomColor: selectedGroup.color || "#4f46e5" }
                    : {}
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 pb-10">
            {activeTab === "expenses" && <ExpenseTab group={selectedGroup} />}
            {activeTab === "balance" && <BalanceTab group={selectedGroup} />}
            {activeTab === "shopping" && <ShoppingTab group={selectedGroup} />}
            {activeTab === "summary" && <SummaryTab group={selectedGroup} />}
            {activeTab === "activity" && <ActivityTab group={selectedGroup} />}
            {activeTab === "trash" && <TrashTab group={selectedGroup} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showWelcome && (
        <WelcomeModal
          name={currentUser.displayName}
          onClose={handleCloseWelcome}
        />
      )}

      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">💸</span>
          <span className="font-bold text-gray-800">GastosApp</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProfile(true)}
            className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            {currentUser.displayName}
          </button>
          <button
            onClick={logout}
            className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-3 space-y-3">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm mb-2">Crear grupo</h3>
          <form onSubmit={handleCreate} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nombre del grupo"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
              <button
                type="submit"
                className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
                style={{ backgroundColor: newGroupColor }}
              >
                Crear
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {GROUP_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewGroupColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    newGroupColor === color
                      ? "scale-125 ring-2 ring-offset-1 ring-gray-400"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm mb-2">Unirse a grupo</h3>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="ID del grupo"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              Unirse
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Tus grupos</h3>
          {loading ? (
            <p className="text-gray-400 text-sm">Cargando...</p>
          ) : groups.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No tienes grupos todavía</p>
          ) : (
            <ul className="space-y-2">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all"
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => handleSelectGroup(group)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: group.color || "#4f46e5" }}
                      />
                      <p className="font-semibold text-gray-800 text-sm truncate">{group.name}</p>
                      {newCounts[group.id] > 0 && (
                        <span
                          className="text-xs text-white font-bold rounded-full px-1.5 py-0.5 shrink-0"
                          style={{ backgroundColor: group.color || "#4f46e5" }}
                        >
                          {newCounts[group.id]}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-1 shrink-0 ml-2">
                      {group.members.length} {group.members.length === 1 ? "miembro" : "miembros"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-5">
                    <p className="text-xs text-gray-400 font-mono truncate">{group.id}</p>
                    <button
                      onClick={(e) => handleCopy(e, group.id)}
                      className={`text-xs font-medium shrink-0 transition-colors ${
                        copiedId === group.id
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
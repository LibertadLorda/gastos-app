import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../../firebase/config";

export default function Profile({ onBack }) {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser.displayName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function handleNameSubmit(e) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSavingName(true);
    setNameError("");
    setNameSuccess(false);
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch {
      setNameError("Error al actualizar el nombre");
    }
    setSavingName(false);
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      return setPasswordError("Las contraseñas no coinciden");
    }
    if (newPassword.length < 6) {
      return setPasswordError("La contraseña debe tener al menos 6 caracteres");
    }
    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPasswordError("La contraseña actual es incorrecta");
      } else {
        setPasswordError("Error al cambiar la contraseña");
      }
    }
    setSavingPassword(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="text-indigo-600 font-semibold text-sm shrink-0"
        >
          ← Volver
        </button>
        <span className="font-bold text-gray-800">Mi perfil</span>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-1">
          <p className="text-xs text-gray-400">Email</p>
          <p className="text-sm font-medium text-gray-700">{currentUser.email}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Cambiar nombre</h3>
          {nameError && (
            <div className="bg-red-50 text-red-500 text-xs rounded-lg px-3 py-2 mb-3">
              {nameError}
            </div>
          )}
          {nameSuccess && (
            <div className="bg-green-50 text-green-600 text-xs rounded-lg px-3 py-2 mb-3">
              Nombre actualizado correctamente
            </div>
          )}
          <form onSubmit={handleNameSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={savingName}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {savingName ? "Guardando..." : "Guardar nombre"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Cambiar contraseña</h3>
          {passwordError && (
            <div className="bg-red-50 text-red-500 text-xs rounded-lg px-3 py-2 mb-3">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="bg-green-50 text-green-600 text-xs rounded-lg px-3 py-2 mb-3">
              Contraseña actualizada correctamente
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {savingPassword ? "Guardando..." : "Cambiar contraseña"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
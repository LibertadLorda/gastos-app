import { useState } from "react";
import { useShoppingList } from "../hooks/useShoppingList";

export default function ShoppingTab({ group }) {
  const { items, loading, addItem, toggleItem, deleteItem } = useShoppingList(group.id);
  const [newItem, setNewItem] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    if (!newItem.trim()) return;
    await addItem(newItem.trim());
    setNewItem("");
  }

  const pending = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Añadir producto..."
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Añadir
        </button>
      </form>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <>
          {pending.length === 0 && checked.length === 0 && (
            <p className="text-gray-400 text-sm italic">La lista está vacía</p>
          )}

          {pending.length > 0 && (
            <ul className="space-y-2">
              {pending.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => toggleItem(item.id, item.checked)}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">Añadido por {item.addedBy}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-lg"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {checked.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">Cogido</p>
              <ul className="space-y-1">
                {checked.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => toggleItem(item.id, item.checked)}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <p className="text-sm text-gray-400 line-through">{item.name}</p>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-lg"
                    >
                      ×
                    </button>
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
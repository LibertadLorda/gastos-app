import { useActivity } from "../hooks/useActivity";
import { formatDate } from "../utils/formatDate";

const TYPE_ICONS = {
  add_expense: "💸",
  edit_expense: "✏️",
  delete_expense: "🗑️",
  add_payment: "💰",
  join_group: "👋",
};

export default function ActivityTab({ group }) {
  const { activity } = useActivity(group.id);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-700">Actividad reciente</h3>
      {activity.length === 0 ? (
        <p className="text-gray-400 text-sm italic">No hay actividad todavía</p>
      ) : (
        <ul className="space-y-2">
          {activity.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100"
            >
              <span className="text-lg shrink-0">{TYPE_ICONS[item.type] || "📌"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{item.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.userName} · {formatDate(item.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
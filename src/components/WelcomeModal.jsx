export default function WelcomeModal({ name, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">💸</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ¡Hola, {name}!
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Bienvenido a GastosApp. Aquí puedes gestionar y compartir gastos con tus grupos de forma sencilla.
        </p>
        <div className="space-y-2 text-left mb-6">
          {[
            { icon: "👥", text: "Crea o únete a un grupo" },
            { icon: "💸", text: "Añade gastos propios o compartidos" },
            { icon: "⚖️", text: "Consulta quién debe qué a quién" },
            { icon: "🛒", text: "Comparte una lista de la compra" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-gray-600">{item.text}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          ¡Empezar!
        </button>
      </div>
    </div>
  );
}
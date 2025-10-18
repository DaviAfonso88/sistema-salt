import { useContext } from "react";
import { AppContext } from "../context/AppContext.jsx";
import {
  FaFolder,
  FaDollarSign,
  FaRegCommentDots,
  FaTasks,
} from "react-icons/fa";

export default function Dashboard() {
  const { categories, financials, communications, projects } =
    useContext(AppContext);

  if (!financials || !categories || !communications || !projects) {
    return <div>Carregando...</div>;
  }

  const totalIncome = (financials || []).reduce(
    (acc, f) => acc + (Number(f.amount) || 0),
    0
  );

  const stats = [
    {
      label: "Categorias",
      value: categories.length,
      icon: <FaFolder className="text-blue-500 w-8 h-8" />,
    },
    {
      label: "Transações",
      value: financials.length,
      icon: <FaDollarSign className="text-green-500 w-8 h-8" />,
      extra: (
        <span className="text-green-400 font-semibold mt-1">
          Total: R$ {totalIncome.toFixed(2)}
        </span>
      ),
    },
    {
      label: "Posts",
      value: communications.length,
      icon: <FaRegCommentDots className="text-yellow-400 w-8 h-8" />,
    },
    {
      label: "Projetos",
      value: projects.length,
      icon: <FaTasks className="text-purple-500 w-8 h-8" />,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className="card relative flex flex-col items-center justify-center overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 opacity-20 text-6xl">
              {item.icon}
            </div>
            <div className="flex flex-col items-center z-10">
              <div className="text-gray-400 font-semibold mb-2">
                {item.label}
              </div>
              <div className="text-3xl font-bold">{item.value}</div>
              {item.extra && <div>{item.extra}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

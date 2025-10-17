import { useContext, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext.jsx";
import dayjs from "dayjs";
import { Line, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { FaArrowUp, FaArrowDown, FaMoneyBillWave } from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function DashboardFinanceCompleto() {
  const { financials, categories } = useContext(AppContext);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredFinancials = useMemo(() => {
    return financials.filter((f) => {
      const date = dayjs(f.id);
      const afterStart = startDate
        ? date.isAfter(dayjs(startDate).subtract(1, "day"))
        : true;
      const beforeEnd = endDate
        ? date.isBefore(dayjs(endDate).add(1, "day"))
        : true;
      return afterStart && beforeEnd;
    });
  }, [financials, startDate, endDate]);

  const totalIncome = filteredFinancials
    .filter((f) => f.type === "income")
    .reduce((acc, f) => acc + f.amount, 0);
  const totalExpense = filteredFinancials
    .filter((f) => f.type === "expense")
    .reduce((acc, f) => acc + f.amount, 0);
  const balance = totalIncome - totalExpense;

  const pieData = {
    labels: ["Receitas", "Despesas"],
    datasets: [
      {
        data: [totalIncome, totalExpense],
        backgroundColor: ["#34D399", "#F87171"],
        borderColor: ["#121214", "#121214"],
        borderWidth: 2,
      },
    ],
  };

  const dataByCategory = useMemo(() => {
    const map = {};
    filteredFinancials.forEach((f) => {
      const category = categories.find((c) => c.id === f.categoryId);
      const name = category ? category.name : "Sem categoria";
      if (!map[name]) map[name] = { name, income: 0, expense: 0 };
      if (f.type === "income") map[name].income += f.amount;
      else map[name].expense += f.amount;
    });
    return Object.values(map);
  }, [filteredFinancials, categories]);

  const barData = {
    labels: dataByCategory.map((c) => c.name),
    datasets: [
      {
        label: "Receita",
        data: dataByCategory.map((c) => c.income),
        backgroundColor: "#34D399",
      },
      {
        label: "Despesa",
        data: dataByCategory.map((c) => c.expense),
        backgroundColor: "#F87171",
      },
    ],
  };

  const saldoMensal = useMemo(() => {
    const sorted = [...filteredFinancials].sort((a, b) => a.id - b.id);
    const map = {};
    let saldo = 0;
    sorted.forEach((f) => {
      const month = dayjs(f.id).format("YYYY-MM");
      if (!map[month]) map[month] = 0;
      saldo += f.type === "income" ? f.amount : -f.amount;
      map[month] = saldo;
    });
    return Object.keys(map)
      .sort()
      .map((month) => ({ month, saldo: map[month] }));
  }, [filteredFinancials]);

  const lineData = {
    labels: saldoMensal.map((d) => d.month),
    datasets: [
      {
        label: "Saldo",
        data: saldoMensal.map((d) => d.saldo),
        borderColor: "#6C4BFF",
        backgroundColor: "rgba(108,75,255,0.2)",
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const maxIncome = Math.max(
    ...filteredFinancials
      .filter((f) => f.type === "income")
      .map((f) => f.amount),
    0
  );
  const maxExpense = Math.max(
    ...filteredFinancials
      .filter((f) => f.type === "expense")
      .map((f) => f.amount),
    0
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Dashboard Financeiro
      </h1>

      {/* Filtro por período */}
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-dark-300 border border-dark-400 text-white placeholder-gray-400 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary transition"
        />
        <span className="self-center">até</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-dark-300 border border-dark-400 text-white placeholder-gray-400 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary transition"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-200 p-6 rounded-2xl shadow-glow transition">
          <h2 className="text-xl font-semibold mb-4">Receitas vs Despesas</h2>
          <div className="w-full h-80">
            <Pie
              data={pieData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: "#fff" } } },
              }}
            />
          </div>
        </div>
        <div className="bg-dark-200 p-6 rounded-2xl shadow-glow transition">
          <h2 className="text-xl font-semibold mb-4">Valores por Categoria</h2>
          <div className="w-full h-80">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: "#fff" } } },
                scales: {
                  x: { ticks: { color: "#fff" }, grid: { color: "#2c2c36" } },
                  y: { ticks: { color: "#fff" }, grid: { color: "#2c2c36" } },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-dark-200 p-6 rounded-2xl shadow-glow transition">
        <h2 className="text-xl font-semibold mb-4">Saldo ao longo do tempo</h2>
        <div className="w-full h-96">
          <Line
            data={lineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: "#fff" } } },
              scales: {
                x: { ticks: { color: "#fff" }, grid: { color: "#2c2c36" } },
                y: { ticks: { color: "#fff" }, grid: { color: "#2c2c36" } },
              },
            }}
          />
        </div>
      </div>

      {/* Destaques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-700 p-6 rounded-2xl shadow-glow flex flex-col items-center">
          <h2 className="font-semibold text-lg">Maior Receita</h2>
          <p className="text-2xl font-bold">R$ {maxIncome.toFixed(2)}</p>
        </div>
        <div className="bg-red-700 p-6 rounded-2xl shadow-glow flex flex-col items-center">
          <h2 className="font-semibold text-lg">Maior Despesa</h2>
          <p className="text-2xl font-bold">R$ {maxExpense.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

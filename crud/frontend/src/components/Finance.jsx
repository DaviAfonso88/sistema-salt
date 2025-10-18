import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext.jsx";
import { FaArrowUp, FaArrowDown, FaTrash, FaUpload } from "react-icons/fa";
import DashboardFinanceCompleto from "./DashboardFinance";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../service/api";

export default function Finance() {
  const { financials, setFinancials, categories, currentUser } =
    useContext(AppContext);

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("income");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // ====== FETCH FINANCIAL TRANSACTIONS ======
  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        const res = await api.get("/financials", {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        setFinancials(res.data);
      } catch (err) {
        console.error("Erro ao carregar transações:", err);
      }
    };
    fetchFinancials();
  }, [currentUser, setFinancials]);

  // ====== ADD TRANSACTION ======
  const addTransaction = async () => {
    if (!desc || !amount || !categoryId) {
      toast.error("Preencha todos os campos antes de adicionar!");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("description", desc);
    formData.append("amount", parseFloat(amount) || 0);
    formData.append("categoryId", categoryId);
    formData.append("type", type);
    if (file) formData.append("file", file);

    try {
      const res = await api.post("/financials", formData, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      setFinancials((prev) => [res.data, ...prev]);
      toast.success("Transação adicionada com sucesso!");
      setDesc("");
      setAmount("");
      setCategoryId("");
      setType("income");
      setFile(null);
    } catch (err) {
      console.error("Erro ao adicionar transação:", err);
      toast.error("Erro ao adicionar transação.");
    } finally {
      setLoading(false);
    }
  };

  // ====== DELETE TRANSACTION ======
  const deleteTransaction = async (id, userId) => {
    if (currentUser.role !== "admin" && currentUser.id !== userId) {
      toast.error("Você não tem permissão para excluir esta transação.");
      return;
    }
    try {
      await api.delete(`/financials/${id}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      setFinancials((prev) => prev.filter((f) => f.id !== id));
      toast.info("Transação removida.");
    } catch (err) {
      console.error("Erro ao excluir transação:", err);
      toast.error("Erro ao excluir transação.");
    }
  };

  // ====== CÁLCULOS ======
  const totalIncome = financials
    .filter((f) => f.type === "income")
    .reduce((acc, cur) => acc + Number(cur.amount || 0), 0);

  const totalExpense = financials
    .filter((f) => f.type === "expense")
    .reduce((acc, cur) => acc + Number(cur.amount || 0), 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Painel de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Receitas", value: totalIncome, color: "green" },
          { label: "Despesas", value: totalExpense, color: "red" },
          {
            label: "Saldo Total",
            value: balance,
            color: balance >= 0 ? "green" : "red",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="card transform hover:-translate-y-1 hover:shadow-glow transition-all duration-300"
          >
            <h3 className="text-sm font-semibold text-gray-300">
              {item.label}
            </h3>
            <p
              className={`text-2xl font-bold mt-2 ${
                item.color === "green" ? "text-green-400" : "text-red-400"
              }`}
            >
              R$ {Number(item.value || 0).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Formulário de Adição */}
      <div className="card">
        <h2 className="text-xl font-bold mb-6 text-center">
          Adicionar Transação
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Descrição"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Valor"
            type="number"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Categoria</option>
            {categories
              .filter((c) => c.location === "finance")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
          <label className="flex items-center justify-center gap-2 cursor-pointer border-dashed rounded-xl px-4 py-3 w-full hover:bg-[#1f1f28] transition">
            <FaUpload className="text-purple-400" />
            <span className="text-sm truncate">
              {file ? file.name : "Anexar arquivo"}
            </span>
            <input
              type="file"
              onChange={(e) => {
                setFile(e.target.files[0]);
                toast.info(`Arquivo selecionado: ${e.target.files[0].name}`);
              }}
              className="hidden"
            />
          </label>
          <button
            onClick={addTransaction}
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Transações Recentes</h2>
        <ul className="flex flex-col gap-4 max-h-96 overflow-y-auto">
          {financials.map((f) => (
            <li
              key={f.id}
              className={`flex flex-col md:flex-row md:justify-between items-start md:items-center p-4 rounded-2xl border transition hover:shadow-glow ${
                f.type === "income"
                  ? "border-green-400 bg-green-900/20"
                  : "border-red-400 bg-red-900/20"
              }`}
            >
              <div className="flex flex-col gap-1 w-full md:w-auto">
                <span className="font-semibold text-white">
                  {f.description}
                </span>
                <span
                  className={`${
                    f.type === "income" ? "text-green-400" : "text-red-400"
                  } flex items-center gap-2`}
                >
                  {f.type === "income" ? <FaArrowUp /> : <FaArrowDown />} R$
                  {Number(f.amount || 0).toFixed(2)}
                </span>
                <span className="text-gray-400 text-sm">
                  {categories.find((c) => c.id === f.categoryId)?.name ||
                    "Sem categoria"}
                </span>
                {f.file && (
                  <a
                    href={f.file.url}
                    download={f.file.name}
                    className="text-purple-400 text-sm underline mt-1 truncate"
                  >
                    📎 {f.file.name}
                  </a>
                )}
              </div>
              {(currentUser.role === "admin" ||
                currentUser.id === f.userId) && (
                <button
                  onClick={() => deleteTransaction(f.id, f.userId)}
                  className="text-red-500 hover:text-red-700 mt-2 md:mt-0"
                >
                  <FaTrash />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Gráficos */}
      <div className="card">
        <DashboardFinanceCompleto />
      </div>
    </div>
  );
}

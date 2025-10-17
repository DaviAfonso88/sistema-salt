import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext.jsx";
import {
  FaTrash,
  FaPlus,
  FaMoneyBillWave,
  FaCommentDots,
} from "react-icons/fa";
import api from "../service/api"; // sua instância axios

export default function Categories() {
  const { categories, setCategories, currentUser } = useContext(AppContext);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("finance"); // default Financeiro
  const [loading, setLoading] = useState(false);

  // ====== FETCH CATEGORIES ======
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories", {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        setCategories(
          res.data.map((c) => ({
            ...c,
            userId: c.author_id || currentUser.id,
            color: "#1B1C22",
            textColor: "#E6F0FF",
          }))
        );
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
      }
    };
    fetchCategories();
  }, [currentUser, setCategories]);

  // ====== ADD CATEGORY ======
  const addCategory = async () => {
    if (!name || !location) return;
    setLoading(true);
    try {
      const res = await api.post(
        "/categories",
        { name },
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      const newCat = {
        id: res.data.id,
        name: res.data.name,
        location,
        userId: currentUser.id,
        color: location === "finance" ? "#1B1C22" : "#1B1C22",
        textColor: location === "finance" ? "#E6F0FF" : "#F5E6FF",
      };
      setCategories([...categories, newCat]);
      setName("");
      setLocation("finance");
    } catch (err) {
      console.error("Erro ao adicionar categoria:", err);
    } finally {
      setLoading(false);
    }
  };

  // ====== DELETE CATEGORY ======
  const deleteCategory = async (id, userId) => {
    if (currentUser.role !== "admin" && currentUser.id !== userId) return;
    try {
      await api.delete(`/categories/${id}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Erro ao deletar categoria:", err);
    }
  };

  const financeCategories = categories.filter((c) => c.location === "finance");
  const communicationCategories = categories.filter(
    (c) => c.location === "communication"
  );

  const renderCategoryCard = (c, icon) => (
    <div
      key={c.id}
      className="relative p-4 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex items-center justify-between card"
      style={{ background: c.color }}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div className="flex flex-col">
          <span
            className="font-semibold text-lg"
            style={{ color: c.textColor }}
          >
            {c.name}
          </span>
          <span className="text-sm italic" style={{ color: c.textColor }}>
            {c.location === "finance" ? "Financeiro" : "Comunicação"}
          </span>
        </div>
      </div>
      {(currentUser.role === "admin" || currentUser.id === c.userId) && (
        <button
          onClick={() => deleteCategory(c.id, c.userId)}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition text-xl p-2 rounded-full hover:bg-red-100"
          title="Excluir Categoria"
        >
          <FaTrash />
        </button>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <h1 className="text-4xl font-bold text-white text-center mb-6">
        📂 Categorias
      </h1>

      {/* Formulário de Adição */}
      <div className="card flex flex-col md:flex-row gap-4 items-center justify-between">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da nova categoria"
          className="bg-[#1B1C22] border border-[#2C2C36] text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition w-full px-4 py-3"
        />

        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-[#1B1C22] border border-[#2C2C36] text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition w-full px-4 py-3"
        >
          <option value="finance">Financeiro</option>
          <option value="communication">Comunicação</option>
        </select>

        <button
          onClick={addCategory}
          className="btn-primary flex items-center gap-2"
          disabled={loading}
        >
          <FaPlus /> {loading ? "Adicionando..." : "Adicionar"}
        </button>
      </div>

      {/* Seção Financeiro */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-purple-500">
          <FaMoneyBillWave /> Financeiro
        </h2>
        {financeCategories.length === 0 ? (
          <p className="text-gray-400">
            Nenhuma categoria financeira adicionada.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {financeCategories.map((c) =>
              renderCategoryCard(
                c,
                <FaMoneyBillWave className="text-purple-500 text-2xl" />
              )
            )}
          </div>
        )}
      </div>

      {/* Seção Comunicação */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-pink-500">
          <FaCommentDots /> Comunicação
        </h2>
        {communicationCategories.length === 0 ? (
          <p className="text-gray-400">
            Nenhuma categoria de comunicação adicionada.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {communicationCategories.map((c) =>
              renderCategoryCard(
                c,
                <FaCommentDots className="text-pink-500 text-2xl" />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

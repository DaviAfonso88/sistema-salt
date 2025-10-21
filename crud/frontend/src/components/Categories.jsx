import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext.jsx";
import { FaTrash, FaPlus } from "react-icons/fa";
import api from "../service/api";

export default function Categories() {
  const { categories, setCategories, currentUser } = useContext(AppContext);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // ====== FETCH CATEGORIES ======
  useEffect(() => {
    if (!currentUser?.token) return;

    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await api.get("/categories", {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });

        setCategories(
          (res.data || []).map((c) => ({
            ...c,
            userId: c.author_id || currentUser.id,
            color: "#1B1C22",
            textColor: "#E6F0FF",
          }))
        );
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [currentUser, setCategories]);

  // ====== ADD CATEGORY ======
  const addCategory = async () => {
    if (!name || !currentUser?.token) return;
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
        userId: currentUser.id,
        color: "#1B1C22",
        textColor: "#E6F0FF",
      };

      setCategories([...(categories || []), newCat]);
      setName("");
    } catch (err) {
      console.error("Erro ao adicionar categoria:", err);
    } finally {
      setLoading(false);
    }
  };

  // ====== DELETE CATEGORY ======
  const deleteCategory = async (id, userId) => {
    if (!currentUser?.token) return;
    if (currentUser.role !== "admin" && currentUser.id !== userId) return;

    try {
      await api.delete(`/categories/${id}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      setCategories((categories || []).filter((c) => c.id !== id));
    } catch (err) {
      console.error("Erro ao deletar categoria:", err);
    }
  };

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

        <button
          onClick={addCategory}
          className="btn-primary flex items-center gap-2"
          disabled={loading}
        >
          <FaPlus /> {loading ? "Adicionando..." : "Adicionar"}
        </button>
      </div>

      {/* Lista de Categorias */}
      {categories?.length === 0 ? (
        <p className="text-gray-400 mt-4">Nenhuma categoria adicionada.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((c) => (
            <div
              key={c.id}
              className="relative p-4 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex items-center justify-between card"
              style={{ background: c.color }}
            >
              <span
                className="font-semibold text-lg"
                style={{ color: c.textColor }}
              >
                {c.name}
              </span>

              {(currentUser.role === "admin" ||
                currentUser.id === c.userId) && (
                <button
                  onClick={() => deleteCategory(c.id, c.userId)}
                  className="text-red-500 hover:text-red-700 transition text-xl p-2 rounded-full hover:bg-red-100"
                  title="Excluir Categoria"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

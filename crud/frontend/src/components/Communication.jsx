import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext.jsx";
import dayjs from "dayjs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaTrash,
  FaEdit,
  FaHeart,
  FaRegHeart,
  FaPaperPlane,
  FaPaperclip,
  FaDownload,
} from "react-icons/fa";
import api from "../service/api";

export default function Communication() {
  const { communications, setCommunications, categories, currentUser, users } =
    useContext(AppContext);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const [loading, setLoading] = useState(false);

  const communicationCategories = categories
    .filter((c) => c.location === "communication")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const notify = (message, type = "info") => {
    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "warning":
        toast.warn(message);
        break;
      case "error":
        toast.error(message);
        break;
      default:
        toast.info(message);
    }
  };

  // ====== FETCH COMMUNICATION POSTS ======
  useEffect(() => {
    const fetchCommunications = async () => {
      try {
        const res = await api.get("/communications", {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        setCommunications(res.data);
      } catch (err) {
        console.error("Erro ao carregar posts:", err);
      }
    };
    fetchCommunications();
  }, [currentUser, setCommunications]);

  // ====== ADD OR UPDATE POST ======
  const addOrUpdatePost = async () => {
    if (!title.trim() || !content.trim() || !categoryId) {
      notify("Preencha título, conteúdo e categoria.", "warning");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("categoryId", categoryId);
    if (file) formData.append("file", file);

    try {
      let res;
      if (editingId) {
        res = await api.put(`/communications/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        setCommunications((prev) =>
          prev.map((p) => (p.id === editingId ? res.data : p))
        );
        notify("Post atualizado.", "success");
        setEditingId(null);
      } else {
        res = await api.post("/communications", formData, {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        setCommunications((prev) => [res.data, ...prev]);
        notify("Post criado com sucesso.", "success");
      }

      setTitle("");
      setContent("");
      setCategoryId("");
      setFile(null);
      setFilePreview(null);
    } catch (err) {
      console.error("Erro ao salvar post:", err);
      notify("Erro ao salvar post.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ====== DELETE POST ======
  const deletePost = async (postId, userId) => {
    if (currentUser?.id !== userId && currentUser?.role !== "admin") {
      notify("Somente o autor ou administrador pode excluir.", "warning");
      return;
    }
    try {
      await api.delete(`/communications/${postId}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      setCommunications((prev) => prev.filter((p) => p.id !== postId));
      notify("Post excluído.", "info");
    } catch (err) {
      console.error("Erro ao deletar post:", err);
      notify("Erro ao excluir post.", "error");
    }
  };

  // ====== TOGGLE LIKE ======
  const toggleLike = async (postId) => {
    if (!currentUser) {
      notify("Faça login para curtir.", "warning");
      return;
    }
    try {
      const res = await api.post(
        `/communications/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      setCommunications((prev) =>
        prev.map((p) => (p.id === postId ? res.data : p))
      );
    } catch (err) {
      console.error("Erro ao curtir post:", err);
    }
  };

  // ====== ADD COMMENT ======
  const addComment = async (postId) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;
    if (!currentUser) {
      notify("Faça login para comentar.", "warning");
      return;
    }
    try {
      const res = await api.post(
        `/communications/${postId}/comments`,
        { text },
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      setCommunications((prev) =>
        prev.map((p) => (p.id === postId ? res.data : p))
      );
      setCommentInputs((c) => ({ ...c, [postId]: "" }));
    } catch (err) {
      console.error("Erro ao comentar:", err);
    }
  };

  const startEditing = (post) => {
    setTitle(post.title);
    setContent(post.content);
    setCategoryId(post.categoryId.toString());
    setEditingId(post.id);
    setFilePreview(post.fileUrl);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setCategoryId("");
    setFile(null);
    setFilePreview(null);
  };

  const visiblePosts = communications
    .filter((p) =>
      filterCategory ? p.categoryId === parseInt(filterCategory) : true
    )
    .filter((p) =>
      searchTerm
        ? p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.content.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="max-w-6xl mx-auto p-4 bg-[#121214] min-h-screen text-white">
      <ToastContainer position="top-right" autoClose={3500} />
      {/* Formulário e Posts */}
      {/* ...o resto do JSX continua igual */}
      {/* Apenas substituindo as chamadas de estado local por chamadas via API */}
    </div>
  );
}

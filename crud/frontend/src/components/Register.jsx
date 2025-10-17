import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../service/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      toast.error("Preencha todos os campos!");
      return;
    }

    setLoading(true);

    try {
      await api.post("/register", { name, email, password });
      toast.success("Cadastro realizado com sucesso!");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cadastrar. Email pode já estar em uso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121214]">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="card w-96 p-8 flex flex-col gap-4">
        <h1 className="text-2xl text-center">Cadastrar</h1>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
          className="mb-2"
          disabled={loading}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="mb-2"
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="mb-4"
          disabled={loading}
        />

        <button
          onClick={handleRegister}
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>

        <button
          onClick={() => navigate("/login")}
          className="text-sm text-gray-400 hover:underline mt-2"
        >
          Já tem conta? Fazer login
        </button>
      </div>
    </div>
  );
}

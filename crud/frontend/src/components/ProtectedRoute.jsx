import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "../context/AppContext.jsx";

export default function ProtectedRoute({ children }) {
  const { currentUser, loadingUser } = useContext(AppContext);

  if (loadingUser) return <div>Carregando...</div>;

  return currentUser ? children : <Navigate to="/login" />;
}

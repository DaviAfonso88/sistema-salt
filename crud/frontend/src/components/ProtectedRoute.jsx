import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "../context/AppContext.jsx";

export default function ProtectedRoute({ children }) {
  const { currentUser } = useContext(AppContext);
  if (!currentUser) return <Navigate to="/register" />;
  return children;
}

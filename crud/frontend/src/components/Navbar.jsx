import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext.jsx";
import { FaBars, FaTimes } from "react-icons/fa";

export default function Navbar() {
  const { currentUser, logout } = useContext(AppContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const linkClasses =
    "block px-4 py-2 rounded transition font-semibold hover:bg-[#2C2C36]";

  return (
    <nav className="bg-[#1B1C22] text-white shadow-md sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
        <div className="text-lg font-bold">Sistema</div>

        {/* Botão Hamburger para mobile */}
        <button className="md:hidden text-white text-2xl" onClick={toggleMenu}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Menu Desktop */}
        <div className="hidden md:flex gap-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${linkClasses} ${
                isActive ? "underline decoration-pink-500" : ""
              }`
            }
          >
            Início
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `${linkClasses} ${
                isActive ? "underline decoration-pink-500" : ""
              }`
            }
          >
            Categorias
          </NavLink>
          <NavLink
            to="/finance"
            className={({ isActive }) =>
              `${linkClasses} ${
                isActive ? "underline decoration-pink-500" : ""
              }`
            }
          >
            Financeiro
          </NavLink>
          <NavLink
            to="/communication"
            className={({ isActive }) =>
              `${linkClasses} ${
                isActive ? "underline decoration-pink-500" : ""
              }`
            }
          >
            Comunicação
          </NavLink>
          <NavLink
            to="/management"
            className={({ isActive }) =>
              `${linkClasses} ${
                isActive ? "underline decoration-pink-500" : ""
              }`
            }
          >
            Gestão
          </NavLink>
          {currentUser && (
            <button onClick={handleLogout} className="btn-secondary">
              Sair
            </button>
          )}
        </div>
      </div>

      {/* Menu Mobile */}
      {menuOpen && (
        <div className="md:hidden bg-[#1B1C22] w-full px-4 pb-4 flex flex-col gap-2 transition">
          <NavLink
            to="/"
            onClick={() => setMenuOpen(false)}
            className={linkClasses}
          >
            Início
          </NavLink>
          <NavLink
            to="/categories"
            onClick={() => setMenuOpen(false)}
            className={linkClasses}
          >
            Categorias
          </NavLink>
          <NavLink
            to="/finance"
            onClick={() => setMenuOpen(false)}
            className={linkClasses}
          >
            Financeiro
          </NavLink>
          <NavLink
            to="/communication"
            onClick={() => setMenuOpen(false)}
            className={linkClasses}
          >
            Comunicação
          </NavLink>
          <NavLink
            to="/management"
            onClick={() => setMenuOpen(false)}
            className={linkClasses}
          >
            Gestão
          </NavLink>
          {currentUser && (
            <button onClick={handleLogout} className="btn-secondary mt-2">
              Sair
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

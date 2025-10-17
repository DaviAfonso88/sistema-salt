import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Dashboard from "../components/Dashboard";
import Categories from "../components/Categories";
import Finance from "../components/Finance";
import Communication from "../components/Communication";
import Management from "../components/Management";
import Login from "../components/Login";
import ProtectedRoute from "../components/ProtectedRoute";

function App() {
  return (
    <AppProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <Finance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communication"
            element={
              <ProtectedRoute>
                <Communication />
              </ProtectedRoute>
            }
          />
          <Route
            path="/management"
            element={
              <ProtectedRoute>
                <Management />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

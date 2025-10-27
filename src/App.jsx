import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import ResetPassword from "./components/ResetPassword";
import ProductsPage from "./components/productsPage";
import MsgPage from "./components/MsgPage.jsx";
import { supabase } from "./supabase";
import "./App.css";

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session) setUser(data.session.user);
      } catch (err) {
        console.error(err);
        setAuthError("Authentication check failed");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) setUser(session.user);
      else if (event === "SIGNED_OUT") setUser(null);
      setLoading(false);
    });

    return () => subscription.subscription?.unsubscribe();
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setAuthError("");
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error(err);
      setAuthError("Logout failed");
    }
  };

  if (loading) return <div className="app"><p>Loading...</p></div>;

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        {authError && (
          <div className="error-banner">
            <strong>Error:</strong> {authError}
            <button onClick={() => setAuthError("")} className="dismiss-btn">×</button>
          </div>
        )}

        <Routes>
          <Route path="/msg" element={!user ? <Login onAuthSuccess={handleAuthSuccess} /> : <MsgPage user={user} onLogout={handleLogout} />} />

          <Route path="/" element={!user ? <Login onAuthSuccess={handleAuthSuccess} /> : <ProductsPage user={user} onLogout={handleLogout} />} />

          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

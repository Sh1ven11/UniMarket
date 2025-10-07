import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import ResetPassword from "./components/ResetPassword";
import { supabase } from "./supabase";
import "./App.css";

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();

  // ✅ Check for existing session on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication...");
        const { data, error } = await supabase.auth.getSession();
        console.log("Session result:", data, error);

        if (error) {
          console.error("Session check error:", error.message);
          setAuthError("Failed to check authentication");
        } else if (data.session) {
          console.log("User already logged in:", data.session.user);
          setUser(data.session.user);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setAuthError("Authentication check failed");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // ✅ Listen for auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);

      if (event === "SIGNED_IN" && session) {
        setUser(session.user);
        setAuthError("");
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }

      setLoading(false);
    });

    // ✅ Cleanup subscription
    return () => {
      console.log("Cleaning up auth subscription");
      subscription.subscription?.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = (userData) => {
    console.log("Auth success callback:", userData);
    setUser(userData);
    setAuthError("");
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error.message);
        setAuthError("Logout failed");
      } else {
        console.log("User logged out");
        setUser(null);
        setAuthError("");
        navigate("/"); // ✅ Redirect to login
      }
    } catch (err) {
      console.error("Logout error:", err);
      setAuthError("Logout failed");
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <h2>Loading UnitMarket...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        {authError && (
          <div className="error-banner">
            <strong>Error:</strong> {authError}
            <button onClick={() => setAuthError("")} className="dismiss-btn">
              ×
            </button>
          </div>
        )}

        {/* ✅ Define page routes */}
        <Routes>
          <Route
            path="/"
            element={
              !user ? (
                <Login onAuthSuccess={handleAuthSuccess} />
              ) : (
                <div className="dashboard">
                  <div className="welcome-section">
                    <h2>Welcome to UnitMarket! 🎉</h2>
                    <p>
                      Hello,{" "}
                      <strong>{user.user_metadata?.name || user.email}</strong>!
                    </p>
                    <p>You are successfully logged in and ready to start trading.</p>
                  </div>

                  <div className="user-info">
                    <h3>Your Account Info</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>User ID:</label>
                        <span className="monospace">
                          {user.id.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="info-item">
                        <label>Email:</label>
                        <span>{user.email}</span>
                      </div>
                      <div className="info-item">
                        <label>Name:</label>
                        <span>{user.user_metadata?.name || "Not set"}</span>
                      </div>
                      <div className="info-item">
                        <label>Login Time:</label>
                        <span>{new Date().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="action-buttons">
                    <button onClick={handleLogout} className="logout-btn">
                      Logout
                    </button>
                    <button
                      className="primary-btn"
                      onClick={() => alert("Feature coming soon!")}
                    >
                      Browse Products
                    </button>
                  </div>
                </div>
              )
            }
          />

          {/* ✅ Password Reset Page */}
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

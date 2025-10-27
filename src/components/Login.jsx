import { useState } from "react";
import { supabase } from "../supabase";

const Login = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleToggle = () => {
    setIsLogin((s) => !s);
    setMessage("");
  };

  const handleChange = (e) => {
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        // LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        const user = data.user;

        // ✅ On login: only update profile if missing
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", user.id)
            .single();

          if (!profile) {
            // profile row missing completely → create minimal
            await supabase.from("profiles").insert({
              id: user.id,
              first_name: null,
              last_name: null,
            });
          }
        }

        setMessage("Login successful!");
        onAuthSuccess?.(data.user);
      } else {
        // SIGN UP
        if (!formData.first_name.trim() || !formData.last_name.trim()) {
          setMessage("Please provide first name and last name.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        const userId = data?.user?.id;

        if (userId) {
                  // ✅ Insert profile ONLY on signup
             const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: userId,
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
          },
          { onConflict: "id" }
        );


        }

        setMessage("Registration successful! Check your email to confirm.");
        setFormData((f) => ({ ...f, password: "" }));

        setTimeout(() => {
          setIsLogin(true);
          setMessage("");
        }, 1800);
      }
    } catch (err) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h2>UniMarket</h2>
        <h3>{isLogin ? "Login to your account" : "Create an account"}</h3>
        <p>{isLogin ? "Enter your account below:" : "Fill details to create your account:"}</p>
      </div>

      {!forgotPassword ? (
        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label>First name:</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="First name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Last name:</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Last name"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          {message && (
            <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Loading..." : isLogin ? "Login" : "Sign Up"}
          </button>

          {isLogin && (
            <button
              type="button"
              onClick={() => setForgotPassword(true)}
              className="toggle-btn forgot-password"
            >
              Forgot Password?
            </button>
          )}
        </form>
      ) : (
        <form onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setMessage("");

          const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/reset-password`,
          });

          setMessage(error ? error.message : "Reset link sent! Check your email.");
          setLoading(false);
        }} className="login-form">
          <div className="form-group">
            <label>Reset Email:</label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="input-field"
              placeholder="Enter your email"
              required
            />
          </div>

          <button type="submit" className="submit-btn">Send Reset Link</button>

          <button type="button" onClick={() => setForgotPassword(false)} className="toggle-btn">
            Back to Login
          </button>
        </form>
      )}

      <div className="toggle-auth">
        <p>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={handleToggle} className="toggle-btn">
            {isLogin ? "Create account" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;

import { useState } from 'react';
import { supabase } from '../supabase';

const Login = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setMessage('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!supabase) throw new Error('Supabase client not initialized');

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        setMessage('Login successful!');
        onAuthSuccess?.(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { name: formData.name },
          },
        });

        if (error) throw error;
        setMessage('Registration successful!');

        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 💡 Forgot Password handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`, // page you’ll make for updating password
      });

      if (error) throw error;
      setMessage('Password reset email sent! Check your inbox.');
      setForgotPassword(false);
    } catch (error) {
      console.error('Password reset error:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h2>UnitMarket</h2>
        <h3>{isLogin ? 'Login to your account' : 'Create an account'}</h3>
        <p>Enter your account below:</p>
      </div>

      {forgotPassword ? (
        <form onSubmit={handleForgotPassword} className="login-form">
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <button
            type="button"
            onClick={() => setForgotPassword(false)}
            className="toggle-btn"
          >
            Back to Login
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="College Melliel"
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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
              placeholder="Enter your password"
              required
              minLength="6"
            />
            {!isLogin && <small className="hint">Creator account</small>}
          </div>

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Create Account')}
          </button>

          {isLogin && (
            <p className="forgot-password">
              <button
                type="button"
                onClick={() => setForgotPassword(true)}
                className="toggle-btn"
              >
                Forgot Password?
              </button>
            </p>
          )}
        </form>
      )}

      {!forgotPassword && (
        <div className="toggle-auth">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={handleToggle} className="toggle-btn">
              {isLogin ? 'Create an account' : 'Login'}
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default Login;

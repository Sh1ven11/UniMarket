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

  // Add the missing handleToggle function
  const handleToggle = () => {
    setIsLogin(!isLogin);
    setMessage('');
  };

  // Add the missing handleChange function
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
      // Test the Supabase connection first
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      if (isLogin) {
        // Login logic
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) throw error;
        
        setMessage('Login successful!');
        onAuthSuccess?.(data.user);
        
      } else {
        // Register logic
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
            }
          }
        });
        
        if (error) throw error;
        
        setMessage('Registration successful!');
        
        // Auto-switch to login after registration
        setTimeout(() => {
          setIsLogin(true);
        }, 2000);
      }
    } catch (error) {
      console.error('Auth error details:', error);
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
      </form>

      <div className="toggle-auth">
        <p>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={handleToggle} className="toggle-btn">
            {isLogin ? 'Create an account' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
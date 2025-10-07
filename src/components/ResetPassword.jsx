import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage('No valid password reset session found. Please use the link from your email.');
      }
      setSessionChecked(true);
    };
    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage('✅ Password successfully updated! You can now log in.');
    } catch (error) {
      console.error('Password update error:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="login-container">
        <div className="login-header">
          <h2>UnitMarket</h2>
          <h3>Checking reset session...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-header">
        <h2>UnitMarket</h2>
        <h3>Reset Your Password</h3>
        <p>Enter and confirm your new password below:</p>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label>New Password:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label>Confirm Password:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            minLength="6"
          />
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <div className="toggle-auth">
        <p>
          Remember your password?{' '}
          <a href="/" className="toggle-btn">
            Go to Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;

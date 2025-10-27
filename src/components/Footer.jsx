const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">

        <div className="footer-section">
          <h4>Support</h4>
          <p>We’re here to help! If you have any questions or issues, reach out to our support team anytime.</p>
        </div>
        
        <div className="footer-section">
          <h4>Account</h4>
          <div className="account-info">
            <div className="account-logo">My Account / Register</div>
          </div>
        </div>
        
        <div className="footer-section">
          <h4>Quick Link</h4>
          <div className="quick-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Use</a>
            <a href="#info">Info External</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

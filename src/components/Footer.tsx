import React from 'react';

const Footer: React.FC = () => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-section footer-left">
        <img className="footer-logo" src="/Gemini_Generated_Image_5rph3y5rph3y5rph.png" alt="Little Learners Hub logo" />
        <p className="footer-desc">
          <strong>Little Learners Hub</strong> is a digital platform for Pre school child for E learning.
        </p>
        <p className="footer-desc">
          UI / UX Design and Website Development located in Sri Lanka
        </p>
        <p className="footer-copyright">© 2025 Little Learners Hub All Rights Reserved.</p>
      </div>

      <div className="footer-section footer-middle">
        <div className="footer-col">
          <h3 className="footer-heading">Support</h3>
          <div className="footer-item">
            <span className="footer-icon">📍</span>
            <div>
              <p>SLIIT Malabe Campus,</p>
              <p>New Kandy Road,</p>
              <p>Malabe.</p>
            </div>
          </div>
          <div className="footer-item">
            <span className="footer-icon">✉️</span>
            <a href="mailto:prescelearn@gmail.com" className="footer-link">prescelearn@gmail.com</a>
          </div>
          <div className="footer-item">
            <span className="footer-icon">📞</span>
            <a href="tel:+94752151681" className="footer-link">+94 75 2151 681</a>
          </div>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Quick Links</h3>
          <ul className="footer-links">
            <li><a href="#" className="footer-link">Service</a></li>
            <li><a href="#" className="footer-link">Features</a></li>
            <li><a href="#" className="footer-link">Our Team</a></li>
            <li><a href="#" className="footer-link">Portfolio</a></li>
            <li><a href="#" className="footer-link">Blog</a></li>
            <li><a href="#" className="footer-link">Contact Us</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-section footer-right">
        <h3 className="footer-heading">Follow Us</h3>
        <p className="footer-social-text">Connect with parents & educators!</p>
        <div className="footer-social">
          {/* Social icons placeholders - add images later */}
          <a href="#" className="social-icon" title="Instagram">📷</a>
          <a href="#" className="social-icon" title="Facebook">f</a>
          <a href="#" className="social-icon" title="Twitter">𝕏</a>
          <a href="#" className="social-icon" title="LinkedIn">🔗</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

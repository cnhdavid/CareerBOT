import React from 'react';
import { 
  Bot, 
  Database, 
  Shield, 
  AlertTriangle, 
  FileText, 
  UserCheck,
  X
} from 'lucide-react';
import './OpenAIDisclaimer.css';

const OpenAIDisclaimer = ({ onAccept, onDecline }) => {
  return (
    <div className="disclaimer-overlay">
      <div className="disclaimer-modal">
        <div className="disclaimer-header">
          <Bot size={32} className="disclaimer-icon" />
          <h2>AI Services Information</h2>
        </div>
        
        <div className="disclaimer-content">
          <div className="disclaimer-section">
            <h3><Bot size={18} className="section-icon" /> AI Technology</h3>
            <p>
              CareerBOT uses OpenAI's advanced language models to provide personalized career guidance 
              and educational advice. Your conversations and profile information are processed to 
              deliver relevant, professional recommendations.
            </p>
          </div>

          <div className="disclaimer-section">
            <h3><Database size={18} className="section-icon" /> Data & Privacy</h3>
            <ul>
              <li><strong>Conversations:</strong> Processed by OpenAI to generate responses</li>
              <li><strong>Profile Data:</strong> Career details and CV information analyzed for personalized advice</li>
              <li><strong>File Uploads:</strong> Documents processed for content extraction</li>
              <li><strong>Data Retention:</strong> History maintained for context and service improvement</li>
            </ul>
          </div>

          <div className="disclaimer-section">
            <h3><Shield size={18} className="section-icon" /> Security</h3>
            <p>
              Industry-standard security protocols including HTTP-only secure cookies, 
              encrypted data transmission, and secure authentication. Avoid sharing 
              highly sensitive personal information in conversations.
            </p>
          </div>

          <div className="disclaimer-section">
            <h3><AlertTriangle size={18} className="section-icon" /> Important Notes</h3>
            <ul>
              <li>AI advice supplements, not replaces, professional career counseling</li>
              <li>Verify recommendations before making career decisions</li>
              <li>Avoid sharing sensitive information (SSN, financial details, passwords)</li>
              <li>OpenAI may use anonymized data for service improvement</li>
            </ul>
          </div>

          <div className="disclaimer-section">
            <h3><UserCheck size={18} className="section-icon" /> Your Rights</h3>
            <p>
              Request data deletion, export information, or close your account anytime 
              through profile settings. Continued use constitutes consent to the 
              data processing described above.
            </p>
          </div>
        </div>

        <div className="disclaimer-actions">
          <button className="disclaimer-btn decline" onClick={onDecline}>
            Decline & Exit
          </button>
          <button className="disclaimer-btn accept" onClick={onAccept}>
            I Understand & Accept
          </button>
        </div>

        <div className="disclaimer-footer">
          <FileText size={16} className="footer-icon" />
          <p>
            By using CareerBOT, you acknowledge reading and agreeing to this 
            AI usage disclaimer and our privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OpenAIDisclaimer;

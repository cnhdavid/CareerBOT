import { Save, Check } from "lucide-react";
import "./SignupCTA.css";

export default function SignupCTA({ onSignup, onDismiss }) {
  return (
    <div className="signup-cta-overlay">
      <div className="signup-cta-modal">
        <button className="signup-cta-close" onClick={onDismiss}>×</button>
        <div className="signup-cta-content">
          <h3><Save size={24} style={{display: 'inline', marginRight: '8px'}} /> Save Your Conversation History</h3>
          <p>Sign up to save your chat history and unlock unlimited messages!</p>
          <div className="signup-cta-benefits">
            <div className="benefit-item"><Check size={18} style={{display: 'inline', marginRight: '8px', color: '#10b981'}} /> Unlimited messages</div>
            <div className="benefit-item"><Check size={18} style={{display: 'inline', marginRight: '8px', color: '#10b981'}} /> Save conversation history</div>
            <div className="benefit-item"><Check size={18} style={{display: 'inline', marginRight: '8px', color: '#10b981'}} /> Personalized career advice</div>
            <div className="benefit-item"><Check size={18} style={{display: 'inline', marginRight: '8px', color: '#10b981'}} /> CV analysis & feedback</div>
          </div>
          <button className="signup-cta-button" onClick={onSignup}>
            Sign Up Now
          </button>
          <button className="signup-cta-dismiss" onClick={onDismiss}>
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";

export default function ProfileModal({ onClose }) {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    surname: "",
    birthday: "",
    targetPosition: "",
    cvText: "",
    cvFile: null,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        password: "",
        name: user.name || "",
        surname: user.surname || "",
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : "",
        targetPosition: user.targetPosition || "",
        cvText: user.cvText || "",
        cvFile: null,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const submitData = { ...formData };
      if (formData.cvFile) {
        // For now, just store the filename
        submitData.cvFile = formData.cvFile.name;
      }
      await updateUser(submitData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-modal">
      <h2>{t('profile.title', { defaultValue: 'Profile Settings' })}</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('profile.email', { defaultValue: 'Email' })}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>{t('profile.password', { defaultValue: 'New Password (leave empty to keep current)' })}</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t('profile.passwordPlaceholder', { defaultValue: 'Leave empty to keep current password' })}
          />
        </div>

        <div className="form-group">
          <label>{t('profile.name', { defaultValue: 'First Name' })}</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>{t('profile.surname', { defaultValue: 'Last Name' })}</label>
          <input
            type="text"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>{t('profile.birthday', { defaultValue: 'Birthday' })}</label>
          <input
            type="date"
            name="birthday"
            value={formData.birthday}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="advanced-toggle">
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
        </div>

        {showAdvanced && (
          <>
            <div className="form-group">
              <label>{t('profile.targetPosition', { defaultValue: 'Target Position' })}</label>
              <input
                type="text"
                name="targetPosition"
                value={formData.targetPosition}
                onChange={handleChange}
                placeholder={t('profile.targetPositionPlaceholder', { defaultValue: 'e.g. Software Engineer' })}
              />
            </div>

            <div className="form-group">
              <label>{t('profile.cvText', { defaultValue: 'CV Information' })}</label>
              <textarea
                name="cvText"
                value={formData.cvText}
                onChange={handleChange}
                placeholder={t('profile.cvTextPlaceholder', { defaultValue: 'Enter your CV details here...' })}
                rows={6}
              />
            </div>

            <div className="form-group">
              <label>{t('profile.cvFile', { defaultValue: 'Upload CV File' })}</label>
              <input
                type="file"
                name="cvFile"
                onChange={handleChange}
                accept=".pdf,.doc,.docx,.txt"
              />
              {user?.cvFile && (
                <p className="file-info">{t('profile.currentFile', { defaultValue: 'Current file:' })} {user.cvFile}</p>
              )}
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel-btn">
            {t('profile.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button type="submit" disabled={loading} className="save-btn">
            {loading ? t('profile.saving', { defaultValue: 'Saving...' }) : t('profile.save', { defaultValue: 'Save Changes' })}
          </button>
        </div>
      </form>
    </div>
  );
}
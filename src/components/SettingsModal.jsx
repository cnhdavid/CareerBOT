import { useTranslation } from "react-i18next";

export default function SettingsModal({ theme, setTheme, onClose }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="settings-modal">

      <h2>{t('settings.title')}</h2>

      <div className="setting-row">
        <label>{t('settings.theme')}</label>

        <select value={theme} onChange={e => setTheme(e.target.value)}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      <div className="setting-row">
        <label>{t('settings.language')}</label>

        <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)}>
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>
      </div>

      <button className="close-btn" onClick={onClose}>
        {t('settings.close')}
      </button>

    </div>
  );
}

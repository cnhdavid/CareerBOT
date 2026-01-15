import { useTranslation } from "react-i18next";

export default function SettingsModal({ theme, setTheme, onLanguageChange, onClose }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="settings-modal">

      <h2>{t('settings.title')}</h2>

      <div className="setting-row">
        <label>{t('settings.theme')}</label>
        <select value={theme} onChange={e => setTheme(e.target.value)}>
          <option value="dark">{t('settings.dark')}</option>
          <option value="light">{t('settings.light')}</option>
        </select>
      </div>

      <div className="setting-row">
        <label>{t('settings.language')}</label>

        <select value={i18n.language} onChange={e => onLanguageChange(e.target.value)}>
          <option value="de">{t('settings.de')}</option>
          <option value="en">{t('settings.en')}</option>
        </select>
      </div>

      <button className="close-btn" onClick={onClose}>
        {t('settings.close')}
      </button>

    </div>
  );
}

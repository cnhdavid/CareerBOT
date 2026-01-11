class SessionManager {
  constructor() {
    this.STORAGE_KEY = 'careerbot_settings';
    this.DEFAULT_SETTINGS = {
      theme: this.getSystemTheme(),
      language: 'en'
    };
  }

  getSystemTheme() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }

  getSettings() {
    if (typeof window === 'undefined') {
      return this.DEFAULT_SETTINGS;
    }
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    return this.DEFAULT_SETTINGS;
  }

  saveSettings(settings) {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const currentSettings = this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSettings));
      return updatedSettings;
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
      return null;
    }
  }

  updateSetting(key, value) {
    return this.saveSettings({ [key]: value });
  }

  getSetting(key) {
    const settings = this.getSettings();
    return settings[key];
  }

  clearSettings() {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear settings:', error);
      return false;
    }
  }

  listenToSystemThemeChange(callback) {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        callback(e.matches ? 'dark' : 'light');
      });
      return () => mediaQuery.removeEventListener('change', callback);
    }
    return () => {};
  }
}

export const sessionManager = new SessionManager();

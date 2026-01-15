import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DiscoverModal({ onClose }) {
  const { t } = useTranslation();

  return (
    <div className="rooms-modal">
      <div className="modal-header">
        <h2>{t('sidebar.discover', { defaultValue: 'Discover' })}</h2>
        <button className="icon-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="modal-content">
        {/* Empty content */}
      </div>
    </div>
  );
}

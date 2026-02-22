import React from 'react';
import { useLocalization } from '../../localization/LocalizationProvider';

function AppButton({
  type = 'button',
  text,
  onClick,
  disabled,
  isLoading,
  variant = 'primary',
  fullWidth = true,
  className = '',
}) {
  const { t } = useLocalization();

  return (
    <button
      type={type}
      className={`app-button app-button-${variant} ${fullWidth ? 'app-button-full' : ''} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? t('common.loading') : text}
    </button>
  );
}

export default AppButton;

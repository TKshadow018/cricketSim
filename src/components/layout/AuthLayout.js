import React from 'react';
import { useLocalization } from '../../localization/LocalizationProvider';

function AuthLayout({ children, className = '' }) {
  const { t } = useLocalization();

  return (
    <main className={`auth-layout ${className}`.trim()}>
      <aside className="auth-brand-panel">
        <p className="auth-brand-kicker">{t('brand.name')}</p>
        <h2 className="auth-brand-title">{t('brand.title')}</h2>
        <p className="auth-brand-copy">
          {t('brand.copy')}
        </p>
      </aside>
      <section className="auth-content-panel">{children}</section>
    </main>
  );
}

export default AuthLayout;

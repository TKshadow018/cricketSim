import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../components/ui/AppButton';
import { logoutUser } from '../features/auth/authThunks';
import { useLocalization } from '../localization/LocalizationProvider';
import CricketSimulator from '../features/game/CricketSimulator';

function DashboardPage() {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);
  const { t } = useLocalization();

  const onLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <main className="dashboard-page game-dashboard-page">
      <section className="dashboard-card game-dashboard-card">
        <div className="dashboard-header-row">
          <div>
            <p className="dashboard-kicker">{t('dashboard.kicker')}</p>
            <h1 className="dashboard-title">
              {t('dashboard.welcome', { name: user?.displayName || t('dashboard.fallbackName') })}
            </h1>
            <p className="dashboard-subtitle">{t('dashboard.subtitle')}</p>
          </div>

          <AppButton
            text={t('dashboard.logout')}
            variant="secondary"
            onClick={onLogout}
            isLoading={isLoading}
            fullWidth={false}
          />
        </div>

        <CricketSimulator />
      </section>
    </main>
  );
}

export default DashboardPage;

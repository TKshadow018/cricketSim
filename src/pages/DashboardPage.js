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
    <main className="dashboard-page game-dashboard-page dashboard-shell">
      <header className="dashboard-navbar">
        <div>
          <p className="dashboard-kicker">{t('dashboard.kicker')}</p>
          <h1 className="dashboard-title">
            {t('dashboard.welcome', { name: user?.displayName || t('dashboard.fallbackName') })}
          </h1>
        </div>
        <AppButton
          text={t('dashboard.logout')}
          variant="secondary"
          onClick={onLogout}
          isLoading={isLoading}
          fullWidth={false}
        />
      </header>

      <div className="dashboard-main-grid">
        <aside className="dashboard-sidebar dashboard-sidebar-left">
          <h3>Quick Panel</h3>
          <p>Use setup stages, choose strategies, and simulate ball-by-ball.</p>
          <p>Desktop layout keeps controls and match board visible together.</p>
        </aside>

        <section className="dashboard-center">
          <section className="dashboard-card game-dashboard-card">
            <CricketSimulator />
          </section>
        </section>

        <aside className="dashboard-sidebar dashboard-sidebar-right">
          <h3>Match Notes</h3>
          <p>Track intent limits, choose bowlers carefully, and manage phase changes.</p>
          <p>Use scoreboard toggles to monitor batting and bowling performance.</p>
        </aside>
      </div>
    </main>
  );
}

export default DashboardPage;

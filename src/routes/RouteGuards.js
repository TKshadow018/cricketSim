import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLocalization } from '../localization/LocalizationProvider';

export function ProtectedRoute() {
  const { user, isSessionLoading } = useSelector((state) => state.auth);
  const { t } = useLocalization();

  if (isSessionLoading) {
    return <p className="route-loading">{t('common.checkingSession')}</p>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicOnlyRoute() {
  const { user, isSessionLoading } = useSelector((state) => state.auth);
  const { t } = useLocalization();

  if (isSessionLoading) {
    return <p className="route-loading">{t('common.checkingSession')}</p>;
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

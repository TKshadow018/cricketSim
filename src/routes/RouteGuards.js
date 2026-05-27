import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isDebugMode } from '../config/runtimeConfig';
import { useLocalization } from '../localization/LocalizationProvider';

export function ProtectedRoute() {
  const { user, isSessionLoading } = useSelector((state) => state.auth);
  const { t } = useLocalization();

  if (isSessionLoading) {
    return <p className="route-loading">{t('common.checkingSession')}</p>;
  }

  if (isDebugMode) {
    return <Outlet />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicOnlyRoute() {
  const { user, isSessionLoading } = useSelector((state) => state.auth);
  const { t } = useLocalization();

  if (isSessionLoading) {
    return <p className="route-loading">{t('common.checkingSession')}</p>;
  }

  if (isDebugMode) {
    return <Navigate to="/dashboard" replace />;
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

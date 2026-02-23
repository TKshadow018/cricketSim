import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import { ProtectedRoute, PublicOnlyRoute } from './RouteGuards';
import { startAuthListener } from '../features/auth/authThunks';

const routeSeoMap = {
  '/login': {
    title: 'Play Cricket Games Online | Cricket Sim Arena Login',
    description:
      'Log in to Cricket Sim Arena and play realistic online cricket games with strategic batting and bowling simulation.',
    robots: 'index,follow',
  },
  '/register': {
    title: 'Create Account | Cricket Sim Arena Cricket Game',
    description:
      'Create your Cricket Sim Arena account to start playing immersive cricket simulation games online.',
    robots: 'index,follow',
  },
  '/dashboard': {
    title: 'Cricket Match Simulator Dashboard | Cricket Sim Arena',
    description:
      'Set up teams, choose match conditions, and play strategic ball-by-ball cricket simulation in the dashboard.',
    robots: 'noindex,follow',
  },
};

const ensureMetaTag = (name, content) => {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const ensureCanonical = (href) => {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

function AppRoutes() {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(startAuthListener());
  }, [dispatch]);

  useEffect(() => {
    const seo = routeSeoMap[location.pathname] || {
      title: 'Cricket Sim Arena | Realistic Online Cricket Games',
      description:
        'Play realistic online cricket games with strategic controls, commentary, and detailed scoreboards in Cricket Sim Arena.',
      robots: 'index,follow',
    };

    document.title = seo.title;
    ensureMetaTag('description', seo.description);
    ensureMetaTag('robots', seo.robots);
    ensureCanonical(`${window.location.origin}${location.pathname}`);
  }, [location.pathname]);

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;

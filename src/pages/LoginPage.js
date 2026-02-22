import React, { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import AuthLayout from '../components/layout/AuthLayout';
import AuthCard from '../components/auth/AuthCard';
import { clearAuthError } from '../features/auth/authSlice';
import { loginUser, loginWithGoogleUser } from '../features/auth/authThunks';
import { useLocalization } from '../localization/LocalizationProvider';

const isEmail = (value) => /\S+@\S+\.\S+/.test(value);

function LoginPage() {
  const dispatch = useDispatch();
  const { user, isLoading, error } = useSelector((state) => state.auth);
  const { t, strings } = useLocalization();
  const minPasswordLength = strings.auth.rules.minPasswordLength;

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const fieldErrors = useMemo(() => {
    if (!submitted) {
      return {};
    }

    return {
      email: !isEmail(form.email) ? t('auth.validation.invalidEmail') : '',
      password:
        form.password.length < minPasswordLength
          ? t('auth.validation.invalidPasswordLength', { min: minPasswordLength })
          : '',
    };
  }, [form, submitted, minPasswordLength, t]);

  const hasValidationError = Object.values(fieldErrors).some(Boolean);

  const onChange = (event) => {
    if (error) {
      dispatch(clearAuthError());
    }

    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);

    if (!isEmail(form.email) || form.password.length < minPasswordLength) {
      return;
    }

    await dispatch(loginUser(form));
  };

  const onGoogleSignIn = async () => {
    if (error) {
      dispatch(clearAuthError());
    }

    await dispatch(loginWithGoogleUser());
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout>
      <AuthCard
        title={t('auth.login.title')}
        subtitle={t('auth.login.subtitle')}
      >
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <AppInput
            id="email"
            label={t('auth.fields.email')}
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder={t('auth.placeholders.email')}
            autoComplete="email"
            error={fieldErrors.email}
            name="email"
          />

          <AppInput
            id="password"
            label={t('auth.fields.password')}
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder={t('auth.placeholders.loginPassword')}
            autoComplete="current-password"
            error={fieldErrors.password}
            name="password"
          />

          {error ? <p className="auth-server-error">{error}</p> : null}

          <AppButton
            type="submit"
            text={t('auth.login.submit')}
            isLoading={isLoading}
            disabled={hasValidationError}
          />
          <AppButton
            type="button"
            text={t('auth.login.continueWithGoogle')}
            variant="secondary"
            isLoading={isLoading}
            onClick={onGoogleSignIn}
          />
        </form>

        <p className="auth-footnote">
          {t('auth.login.footnote')} <Link to="/register">{t('auth.login.footnoteAction')}</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}

export default LoginPage;

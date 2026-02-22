import React, { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import AuthLayout from '../components/layout/AuthLayout';
import AuthCard from '../components/auth/AuthCard';
import { clearAuthError } from '../features/auth/authSlice';
import { registerUser } from '../features/auth/authThunks';
import { useLocalization } from '../localization/LocalizationProvider';

const isEmail = (value) => /\S+@\S+\.\S+/.test(value);

function RegisterPage() {
  const dispatch = useDispatch();
  const { user, isLoading, error } = useSelector((state) => state.auth);
  const { t, strings } = useLocalization();
  const countries = strings.countries;
  const minAge = strings.auth.rules.minAge;
  const maxAge = strings.auth.rules.maxAge;
  const minPasswordLength = strings.auth.rules.minPasswordLength;

  const [form, setForm] = useState({
    name: '',
    age: '',
    country: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const fieldErrors = useMemo(() => {
    if (!submitted) {
      return {};
    }

    return {
      name: form.name.trim().length < 2 ? t('auth.validation.invalidNameLength') : '',
      age:
        !form.age || Number(form.age) < minAge || Number(form.age) > maxAge
          ? t('auth.validation.invalidAgeRange', { min: minAge, max: maxAge })
          : '',
      country: !countries.includes(form.country) ? t('auth.validation.invalidCountry') : '',
      email: !isEmail(form.email) ? t('auth.validation.invalidEmail') : '',
      password:
        form.password.length < minPasswordLength
          ? t('auth.validation.invalidPasswordLength', { min: minPasswordLength })
          : '',
      confirmPassword:
        form.confirmPassword !== form.password ? t('auth.validation.passwordMismatch') : '',
    };
  }, [countries, form, maxAge, minAge, minPasswordLength, submitted, t]);

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

    if (
      form.name.trim().length < 2 ||
      !form.age ||
      Number(form.age) < minAge ||
      Number(form.age) > maxAge ||
      !countries.includes(form.country) ||
      !isEmail(form.email) ||
      form.password.length < minPasswordLength ||
      form.confirmPassword !== form.password
    ) {
      return;
    }

    await dispatch(
      registerUser({
        name: form.name.trim(),
        age: Number(form.age),
        country: form.country,
        email: form.email,
        password: form.password,
      })
    );
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout>
      <AuthCard title={t('auth.register.title')} subtitle={t('auth.register.subtitle')}>
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <AppInput
            id="name"
            label={t('auth.fields.name')}
            value={form.name}
            onChange={onChange}
            placeholder={t('auth.placeholders.name')}
            autoComplete="name"
            error={fieldErrors.name}
            name="name"
          />

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
            id="age"
            label={t('auth.fields.age')}
            type="number"
            value={form.age}
            onChange={onChange}
            placeholder={t('auth.placeholders.age')}
            autoComplete="off"
            error={fieldErrors.age}
            name="age"
            min={minAge}
            max={maxAge}
            inputMode="numeric"
          />

          <AppInput
            id="country"
            label={t('auth.fields.country')}
            type="text"
            value={form.country}
            onChange={onChange}
            placeholder={t('auth.placeholders.country')}
            autoComplete="country-name"
            error={fieldErrors.country}
            name="country"
            list="country-suggestions"
          />

          <datalist id="country-suggestions">
            {countries.map((country) => (
              <option key={country} value={country} />
            ))}
          </datalist>

          <AppInput
            id="password"
            label={t('auth.fields.password')}
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder={t('auth.placeholders.password')}
            autoComplete="new-password"
            error={fieldErrors.password}
            name="password"
          />

          <AppInput
            id="confirmPassword"
            label={t('auth.fields.confirmPassword')}
            type="password"
            value={form.confirmPassword}
            onChange={onChange}
            placeholder={t('auth.placeholders.confirmPassword')}
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            name="confirmPassword"
          />

          {error ? <p className="auth-server-error">{error}</p> : null}

          <AppButton
            type="submit"
            text={t('auth.register.submit')}
            isLoading={isLoading}
            disabled={hasValidationError}
          />
        </form>

        <p className="auth-footnote">
          {t('auth.register.footnote')} <Link to="/login">{t('auth.register.footnoteAction')}</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}

export default RegisterPage;

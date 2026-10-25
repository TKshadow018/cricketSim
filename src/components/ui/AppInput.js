import React, { useState } from 'react';

function AppInput({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled,
  autoComplete,
  variant = 'default',
  className = '',
  ...rest
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = type === 'password';

  return (
    <div className={`app-input-group ${isPasswordField ? 'app-input-group-password' : ''}`.trim()}>
      <label className="app-input-label" htmlFor={id}>
        {label}
      </label>
      <div className="app-input-control">
        <input
          id={id}
          name={name}
          className={`app-input app-input-${variant} ${error ? 'app-input-error' : ''} ${className}`.trim()}
          type={isPasswordField && isPasswordVisible ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
        {isPasswordField ? (
          <button
            type="button"
            className="app-password-toggle"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isPasswordVisible}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            disabled={disabled}
          >
            {isPasswordVisible ? 'Hide' : 'Show'}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="app-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default AppInput;

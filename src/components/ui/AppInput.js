import React from 'react';

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
  return (
    <div className="app-input-group">
      <label className="app-input-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        className={`app-input app-input-${variant} ${error ? 'app-input-error' : ''} ${className}`.trim()}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        {...rest}
      />
      {error ? <p className="app-field-error">{error}</p> : null}
    </div>
  );
}

export default AppInput;

import React from 'react';

function AuthCard({ title, subtitle, children }) {
  return (
    <section className="auth-card" aria-label={title}>
      <h1 className="auth-card-title">{title}</h1>
      <p className="auth-card-subtitle">{subtitle}</p>
      <div className="auth-card-content">{children}</div>
    </section>
  );
}

export default AuthCard;

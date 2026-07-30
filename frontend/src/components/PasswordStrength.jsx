import React from 'react';
import { checkPasswordStrength } from '../utils/validators';

const PasswordStrength = ({ password }) => {
  const {
    score,
    hasMinLength,
    hasUpper,
    hasLower,
    hasDigit,
    hasSpecial,
  } = checkPasswordStrength(password);

  const getStrengthLabel = () => {
    if (!password) return '';
    if (score <= 2) return 'Weak Password';
    if (score <= 4) return 'Medium Password';
    return 'Strong Password';
  };

  const getBarClass = (index) => {
    if (index >= score) return '';
    if (score <= 2) return 'filled-weak';
    if (score <= 4) return 'filled-medium';
    return 'filled-strong';
  };

  const rules = [
    { label: 'Minimum 8 characters', met: hasMinLength },
    { label: 'At least one uppercase letter', met: hasUpper },
    { label: 'At least one lowercase letter', met: hasLower },
    { label: 'At least one number', met: hasDigit },
    { label: 'At least one special character', met: hasSpecial },
  ];

  return (
    <div className="password-rules">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <div className="password-rules-title">Password Strength</div>
        <div 
          style={{ 
            fontSize: '0.75rem', 
            fontWeight: '700',
            color: score <= 2 ? 'var(--color-danger)' : score <= 4 ? 'var(--color-warning)' : 'var(--color-success)'
          }}
        >
          {getStrengthLabel()}
        </div>
      </div>

      <div className="strength-bar-container">
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index} className={`strength-bar ${getBarClass(index)}`} />
        ))}
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        {rules.map((rule, idx) => (
          <div key={idx} className={`password-rule-item ${rule.met ? 'valid' : ''}`}>
            {rule.met ? (
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--color-success)' }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <div className="dot" />
            )}
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrength;

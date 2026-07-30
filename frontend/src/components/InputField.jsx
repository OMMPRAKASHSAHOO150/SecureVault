import React, { useState } from 'react';

const InputField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const handleToggle = () => {
    setShowPassword(!showPassword);
  };

  const currentType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
      </label>
      <div className="form-control-wrapper">
        <input
          id={name}
          name={name}
          type={currentType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`form-control ${error ? 'error' : ''}`}
          required={required}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={handleToggle}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
              outline: 'none',
              padding: '4px',
              userSelect: 'none'
            }}
          >
            {showPassword ? 'HIDE' : 'SHOW'}
          </button>
        )}
      </div>
      {error && (
        <span className="form-error">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};

export default InputField;

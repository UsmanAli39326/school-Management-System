'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { ChevronDown, Check } from 'lucide-react';
import styles from '@/styles/components.module.css';

export default function Select({
  label,
  error,
  icon: Icon,
  className,
  id,
  children,
  options: optionsProp,
  placeholder = 'Select an option',
  value = '',
  onChange,
  disabled = false,
  required = false,
  name,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = selectId ? `${selectId}-error` : undefined;

  // Extract normalized options from optionsProp OR children (<option> tags)
  const normalizedOptions = useMemo(() => {
    if (optionsProp && Array.isArray(optionsProp)) {
      return optionsProp.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
          return {
            value: String(opt.value ?? opt.id ?? ''),
            label: String(opt.label ?? opt.name ?? opt.value ?? opt.id ?? '')
          };
        }
        return { value: String(opt), label: String(opt) };
      });
    }

    const extracted = [];
    React.Children.forEach(children, child => {
      if (React.isValidElement(child) && child.type === 'option') {
        extracted.push({
          value: String(child.props.value ?? ''),
          label: String(child.props.children ?? child.props.value ?? '')
        });
      }
    });
    return extracted;
  }, [optionsProp, children]);

  // Find label for current value
  const selectedOption = useMemo(() => {
    const stringVal = String(value ?? '');
    return normalizedOptions.find(opt => opt.value === stringVal);
  }, [normalizedOptions, value]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optValue) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      // Create synthetic event to stay 100% compatible with standard React event handlers (e.target.value)
      const syntheticEvent = {
        target: {
          name: name || selectId,
          value: optValue
        }
      };
      onChange(syntheticEvent);
    }
  };

  const displayLabel = selectedOption
    ? selectedOption.label
    : (placeholder || 'Select an option');

  const isPlaceholderActive = !selectedOption || selectedOption.value === '';

  return (
    <div className={styles.fieldGroup} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        {/* Trigger Button */}
        <button
          type="button"
          id={selectId}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(prev => !prev)}
          className={clsx(
            styles.customSelectTrigger,
            Icon && styles.customSelectWithIcon,
            isOpen && styles.customSelectOpen,
            error && styles.inputError,
            disabled && styles.customSelectDisabled,
            className
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
        >
          {Icon && (
            <span className={styles.inputIcon} aria-hidden="true">
              <Icon size={18} />
            </span>
          )}

          <span 
            className={styles.customSelectValue}
            style={{ color: isPlaceholderActive ? 'var(--text-muted)' : 'var(--text-primary)' }}
          >
            {displayLabel}
          </span>

          <span 
            className={styles.customSelectChevron} 
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <ChevronDown size={18} />
          </span>
        </button>

        {/* Dropdown Menu Popup */}
        {isOpen && !disabled && (
          <div className={styles.customSelectMenu} role="listbox">
            {normalizedOptions.filter(opt => opt.value !== '' || normalizedOptions.length === 1).length === 0 ? (
              <div className={styles.customSelectEmpty}>No options available</div>
            ) : (
              normalizedOptions
                .filter(opt => opt.value !== '' || normalizedOptions.length === 1)
                .map((opt, idx) => {
                  const isSelected = String(value ?? '') === opt.value;
                  return (
                    <div
                      key={`${opt.value}-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      className={clsx(
                        styles.customSelectOption,
                        isSelected && styles.customSelectOptionSelected
                      )}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check size={16} className={styles.customSelectCheck} />}
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>

      {error && (
        <span id={errorId} className={styles.errorMessage} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

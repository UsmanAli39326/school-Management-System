'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const AlertContext = createContext({
  showAlert: () => {},
});

export function AlertProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    message: '',
    type: 'info', // 'info', 'success', 'error'
    title: '',
  });

  const showAlert = useCallback((message, type = 'info', title = '') => {
    setAlertConfig({ message, type, title });
    setIsOpen(true);
  }, []);

  const closeAlert = () => {
    setIsOpen(false);
  };

  const getIcon = () => {
    switch (alertConfig.type) {
      case 'success':
        return <CheckCircle size={28} color="var(--status-success)" />;
      case 'error':
        return <AlertCircle size={28} color="var(--status-danger)" />;
      case 'info':
      default:
        return <Info size={28} color="var(--primary-color)" />;
    }
  };

  const getTitle = () => {
    if (alertConfig.title) return alertConfig.title;
    switch (alertConfig.type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'info':
      default:
        return 'Information';
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      
      <Modal
        isOpen={isOpen}
        onClose={closeAlert}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {getIcon()}
            <span>{getTitle()}</span>
          </div>
        }
      >
        <div style={{ padding: '1rem 0 1.5rem 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>
          {alertConfig.message}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={closeAlert}>OK</Button>
        </div>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}

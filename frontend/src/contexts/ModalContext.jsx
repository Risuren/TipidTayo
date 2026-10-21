import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SolarTrashBinTrash,
  SolarDangerCircle,
  SolarQuestionCircle,
  SolarShieldCheck,
} from '../components/common/SolarIcons';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState(null);

  // Show a Confirmation Dialog with Confirm & Cancel
  const showConfirm = useCallback(
    ({
      title = 'Are you sure?',
      message = 'Please confirm this action to proceed.',
      details = null,
      type = 'gold', // 'danger' | 'gold' | 'info'
      confirmText = null,
      cancelText = 'Cancel',
      badge = null,
    }) => {
      return new Promise((resolve) => {
        setModalConfig({
          mode: 'confirm',
          title,
          message,
          details,
          type,
          confirmText: confirmText || (type === 'danger' ? 'Yes, Delete' : 'Confirm'),
          cancelText,
          badge,
          onConfirm: () => {
            setModalConfig(null);
            resolve(true);
          },
          onCancel: () => {
            setModalConfig(null);
            resolve(false);
          },
        });
      });
    },
    []
  );

  // Show an Alert / Notice Dialog with a single dismiss button
  const showAlert = useCallback(
    ({
      title = 'Notice',
      message = '',
      details = null,
      type = 'info', // 'danger' | 'gold' | 'info'
      buttonText = 'Understood',
      badge = null,
    }) => {
      return new Promise((resolve) => {
        setModalConfig({
          mode: 'alert',
          title,
          message,
          details,
          type,
          buttonText,
          badge,
          onConfirm: () => {
            setModalConfig(null);
            resolve(true);
          },
        });
      });
    },
    []
  );

  // Convenience helper for Destructive Confirmations (Red theme)
  const confirmDelete = useCallback(
    (options) => {
      return showConfirm({
        type: 'danger',
        confirmText: 'Yes, Remove',
        cancelText: 'Keep Item',
        badge: 'Destructive Action',
        ...options,
      });
    },
    [showConfirm]
  );

  // Convenience helper for Affirmative Confirmations (Gold/Yellow theme)
  const confirmAffirmative = useCallback(
    (options) => {
      return showConfirm({
        type: 'gold',
        confirmText: 'Yes, Proceed',
        cancelText: 'Cancel',
        badge: 'Confirmation',
        ...options,
      });
    },
    [showConfirm]
  );

  // Keyboard accessibility: Escape to cancel, Enter to confirm
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modalConfig) return;
      if (e.key === 'Escape') {
        if (modalConfig.mode === 'confirm') {
          modalConfig.onCancel();
        } else {
          modalConfig.onConfirm();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        modalConfig.onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalConfig]);

  return (
    <ModalContext.Provider
      value={{
        showConfirm,
        showAlert,
        confirmDelete,
        confirmAffirmative,
      }}
    >
      {children}

      {/* Global Interactive Modal Backdrop & Card */}
      <AnimatePresence>
        {modalConfig && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 11000,
              padding: '16px',
              backdropFilter: 'blur(5px)',
            }}
            onClick={() => {
              if (modalConfig.mode === 'confirm') {
                modalConfig.onCancel();
              } else {
                modalConfig.onConfirm();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                width: '100%',
                maxWidth: 'min(420px, 100%)',
                maxHeight: 'calc(100vh - 48px)',
                overflowY: 'auto',
                padding: '24px',
                boxShadow: '0 24px 50px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                textAlign: 'center',
              }}
            >
              {/* Icon Badge Header */}
              <div style={{ margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      modalConfig.type === 'danger'
                        ? '#FEE2E2'
                        : modalConfig.type === 'gold'
                        ? '#FEF3C7'
                        : 'var(--green-100)',
                    border:
                      modalConfig.type === 'danger'
                        ? '1px solid #FECACA'
                        : modalConfig.type === 'gold'
                        ? '1px solid #FDE68A'
                        : '1px solid var(--green-200)',
                  }}
                >
                  {modalConfig.type === 'danger' ? (
                    <SolarTrashBinTrash size={28} color="var(--status-danger)" />
                  ) : modalConfig.type === 'gold' ? (
                    <SolarQuestionCircle size={28} color="#D97706" />
                  ) : (
                    <SolarShieldCheck size={28} color="var(--green-800)" />
                  )}
                </div>

                {modalConfig.badge && (
                  <span
                    className={`badge-pill ${
                      modalConfig.type === 'danger'
                        ? 'badge-danger'
                        : modalConfig.type === 'gold'
                        ? 'badge-gold'
                        : 'badge-green'
                    }`}
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase',
                      backgroundColor: modalConfig.type === 'danger' ? '#FEE2E2' : undefined,
                      color: modalConfig.type === 'danger' ? '#991B1B' : undefined,
                      border: modalConfig.type === 'danger' ? '1px solid #FECACA' : undefined,
                    }}
                  >
                    {modalConfig.badge}
                  </span>
                )}
              </div>

              {/* Title & Message */}
              <div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: modalConfig.type === 'danger' ? '#991B1B' : 'var(--green-950)',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {modalConfig.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    marginTop: '8px',
                    lineHeight: 1.45,
                  }}
                >
                  {modalConfig.message}
                </p>
              </div>

              {/* Optional Item Details Callout Box */}
              {modalConfig.details && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-card-alt)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {typeof modalConfig.details === 'string' ? (
                    <span>{modalConfig.details}</span>
                  ) : (
                    Object.entries(modalConfig.details).map(([key, val]) => (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <strong style={{ color: 'var(--green-950)' }}>{val}</strong>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {modalConfig.mode === 'confirm' ? (
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={modalConfig.onCancel}
                    className="btn-secondary"
                    style={{
                      flex: '1 1 120px',
                      padding: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {modalConfig.cancelText}
                  </button>
                  <button
                    type="button"
                    onClick={modalConfig.onConfirm}
                    className={modalConfig.type === 'danger' ? 'btn-danger' : modalConfig.type === 'gold' ? 'btn-gold' : 'btn-primary'}
                    style={{
                      flex: '1.2 1 140px',
                      padding: '12px',
                      fontWeight: 800,
                    }}
                  >
                    {modalConfig.confirmText}
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={modalConfig.onConfirm}
                    className={modalConfig.type === 'danger' ? 'btn-danger' : modalConfig.type === 'gold' ? 'btn-gold' : 'btn-primary'}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontWeight: 800,
                    }}
                  >
                    {modalConfig.buttonText}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return ctx;
};

export default ModalContext;

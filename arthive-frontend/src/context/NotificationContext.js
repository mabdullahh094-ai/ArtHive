import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Snackbar, Alert, Slide, IconButton, Collapse, Box } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const NotificationContext = createContext({});

export const useNotification = () => useContext(NotificationContext);

const NotificationContainer = ({ children, maxNotifications = 5 }) => {
  const [notifications, setNotifications] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const timersRef = useRef({});

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const removeNotification = useCallback((id) => {
    // Clear any pending timer for this notification
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === id);
      if (notification?.onClose) {
        notification.onClose();
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  const showNotification = useCallback((message, options = {}) => {
    const {
      severity = 'info',
      duration = 6000,
      action,
      onClose,
      persistent = false,
      position = { vertical: 'bottom', horizontal: 'right' },
      title,
      hideCloseButton = false,
      autoHide = true,
    } = options;

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newNotification = {
      id,
      message,
      severity,
      duration: persistent ? null : duration,
      action,
      onClose,
      persistent,
      position,
      title,
      hideCloseButton,
      autoHide,
      timestamp: Date.now(),
    };

    setNotifications((prev) => {
      // Limit number of notifications
      const updated = [newNotification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    // Auto-remove after duration if not persistent and autoHide is true
    if (!persistent && autoHide && duration > 0) {
      timersRef.current[id] = setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, [maxNotifications, removeNotification]);

  const updateNotification = useCallback((id, updates) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, ...updates }
          : notification
      )
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    // Clear all timers
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
    
    // Call onClose for each notification
    notifications.forEach((notification) => {
      if (notification.onClose) {
        notification.onClose();
      }
    });
    
    setNotifications([]);
  }, [notifications]);

  // Helper methods for common notification types
  const showSuccess = useCallback((message, options) => {
    return showNotification(message, { 
      severity: 'success', 
      autoHide: options?.autoHide ?? true,
      ...options 
    });
  }, [showNotification]);

  const showError = useCallback((message, options) => {
    return showNotification(message, { 
      severity: 'error', 
      persistent: options?.persistent ?? true,
      autoHide: options?.autoHide ?? false,
      ...options 
    });
  }, [showNotification]);

  const showWarning = useCallback((message, options) => {
    return showNotification(message, { 
      severity: 'warning', 
      ...options 
    });
  }, [showNotification]);

  const showInfo = useCallback((message, options) => {
    return showNotification(message, { 
      severity: 'info', 
      ...options 
    });
  }, [showNotification]);

  const handleClose = (id, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    removeNotification(id);
  };

  const handleMouseEnter = (id) => {
    setHoveredId(id);
    // Pause auto-hide when hovered
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  };

  const handleMouseLeave = (id, notification) => {
    setHoveredId(null);
    // Resume auto-hide when mouse leaves
    if (!notification.persistent && notification.autoHide && notification.duration) {
      timersRef.current[id] = setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
  };

  // Group notifications by position
  const notificationsByPosition = notifications.reduce((acc, notification) => {
    const key = `${notification.position.vertical}-${notification.position.horizontal}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(notification);
    return acc;
  }, {});

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeNotification,
        updateNotification,
        clearAllNotifications,
        notifications,
      }}
    >
      {children}
      
      {/* Render notifications grouped by position */}
      {Object.entries(notificationsByPosition).map(([positionKey, positionNotifications]) => {
        const [vertical, horizontal] = positionKey.split('-');
        
        return (
          <Box
            key={positionKey}
            sx={{
              position: 'fixed',
              [vertical]: 0,
              [horizontal]: 0,
              zIndex: 9999,
              p: 2,
              maxWidth: 400,
              width: '100%',
              display: 'flex',
              flexDirection: vertical === 'top' ? 'column' : 'column-reverse',
              gap: 1,
            }}
          >
            {positionNotifications.map((notification, index) => (
              <Slide
                key={notification.id}
                direction={vertical === 'top' ? 'down' : 'up'}
                in={true}
                mountOnEnter
                unmountOnExit
              >
                <Box>
                  <Snackbar
                    open
                    autoHideDuration={null} // We handle auto-hide manually
                    onMouseEnter={() => handleMouseEnter(notification.id)}
                    onMouseLeave={() => handleMouseLeave(notification.id, notification)}
                    TransitionComponent={Collapse}
                    sx={{
                      position: 'relative',
                      transform: 'none',
                      left: 'auto',
                      right: 'auto',
                      bottom: 'auto',
                      top: 'auto',
                      minWidth: 300,
                      '& .MuiAlert-root': {
                        boxShadow: 3,
                        width: '100%',
                        alignItems: 'center',
                        '& .MuiAlert-message': {
                          flex: 1,
                        },
                      },
                    }}
                  >
                    <Alert
                      severity={notification.severity}
                      onClose={notification.hideCloseButton ? null : () => handleClose(notification.id, 'close')}
                      action={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {notification.action}
                          {!notification.hideCloseButton && (
                            <IconButton
                              size="small"
                              aria-label="close"
                              color="inherit"
                              onClick={() => handleClose(notification.id, 'close')}
                              sx={{ p: 0.5 }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      }
                      iconMapping={{
                        success: '✅',
                        error: '❌',
                        warning: '⚠️',
                        info: 'ℹ️',
                      }}
                      sx={{
                        width: '100%',
                        '& .MuiAlert-icon': {
                          alignItems: 'center',
                        },
                      }}
                    >
                      <Box>
                        {notification.title && (
                          <Box
                            sx={{
                              fontWeight: 'bold',
                              mb: 0.5,
                              fontSize: '0.95rem',
                            }}
                          >
                            {notification.title}
                          </Box>
                        )}
                        <Box sx={{ fontSize: '0.875rem' }}>
                          {notification.message}
                        </Box>
                        {!notification.persistent && notification.autoHide && notification.duration && (
                          <Box
                            sx={{
                              height: 2,
                              bgcolor: 'background.paper',
                              mt: 1,
                              position: 'relative',
                              overflow: 'hidden',
                              borderRadius: 1,
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                bgcolor: notification.severity === 'info' ? 'info.main' :
                                         notification.severity === 'success' ? 'success.main' :
                                         notification.severity === 'warning' ? 'warning.main' :
                                         'error.main',
                                animation: hoveredId === notification.id ? 'none' : `shrink ${notification.duration}ms linear forwards`,
                                '@keyframes shrink': {
                                  '0%': { width: '100%' },
                                  '100%': { width: '0%' },
                                },
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Alert>
                  </Snackbar>
                </Box>
              </Slide>
            ))}
          </Box>
        );
      })}
    </NotificationContext.Provider>
  );
};

export const NotificationProvider = ({ children, maxNotifications = 5 }) => {
  return (
    <NotificationContainer maxNotifications={maxNotifications}>
      {children}
    </NotificationContainer>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
  maxNotifications: PropTypes.number,
};

export default NotificationProvider;
/**
 * React Snippets - Reusable React components and hooks
 */

export const USE_LOCAL_STORAGE_HOOK = `
/**
 * Custom hook for localStorage with React state
 */
import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(\`Error reading localStorage key "\${key}":\`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(\`Error setting localStorage key "\${key}":\`, error);
    }
  };

  return [storedValue, setValue];
}

// Usage example:
// const [user, setUser] = useLocalStorage('user', null);
// const [theme, setTheme] = useLocalStorage('theme', 'light');
`

export const USE_DEBOUNCE_HOOK = `
/**
 * Custom hook for debouncing values
 */
import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage example:
// const [searchTerm, setSearchTerm] = useState('');
// const debouncedSearchTerm = useDebounce(searchTerm, 500);
// 
// useEffect(() => {
//   if (debouncedSearchTerm) {
//     // Perform search
//   }
// }, [debouncedSearchTerm]);
`

export const USE_FETCH_HOOK = `
/**
 * Custom hook for data fetching
 */
import { useState, useEffect } from 'react';

function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
        }
        
        const result = await response.json();
        
        if (!isCancelled) {
          setData(result);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [url, JSON.stringify(options)]);

  return { data, loading, error };
}

// Usage example:
// const { data, loading, error } = useFetch('/api/users');
// 
// if (loading) return <div>Loading...</div>;
// if (error) return <div>Error: {error}</div>;
// return <div>{JSON.stringify(data)}</div>;
`

export const LOADING_SPINNER_COMPONENT = `
/**
 * Reusable loading spinner component
 */
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'currentColor',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={\`animate-spin \${sizeClasses[size]} \${className}\`}>
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill={color}
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

export default LoadingSpinner;

// Usage example:
// <LoadingSpinner size="lg" color="#667eea" />
// <LoadingSpinner className="mx-auto" />
`

export const MODAL_COMPONENT = `
/**
 * Reusable modal component
 */
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={\`relative w-full \${sizeClasses[size]} transform overflow-hidden rounded-lg bg-white shadow-xl transition-all\`}>
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;

// Usage example:
// const [isModalOpen, setIsModalOpen] = useState(false);
// 
// <Modal 
//   isOpen={isModalOpen} 
//   onClose={() => setIsModalOpen(false)}
//   title="Confirm Action"
//   size="md"
// >
//   <p>Are you sure you want to proceed?</p>
//   <div className="flex justify-end gap-2 mt-4">
//     <button onClick={() => setIsModalOpen(false)}>Cancel</button>
//     <button onClick={handleConfirm}>Confirm</button>
//   </div>
// </Modal>
`

export const TOAST_COMPONENT = `
/**
 * Toast notification component
 */
import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div className={\`fixed top-4 right-4 z-50 transform transition-all duration-300 \${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}\`}>
      <div className={\`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg \${typeStyles[type]}\`}>
        <span className="text-lg">{icons[type]}</span>
        <span className="font-medium">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-2 text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;

// Usage example:
// const [toasts, setToasts] = useState([]);
// 
// const addToast = (message, type) => {
//   const id = Date.now();
//   setToasts(prev => [...prev, { id, message, type }]);
// };
// 
// {toasts.map(toast => (
//   <Toast
//     key={toast.id}
//     message={toast.message}
//     type={toast.type}
//     onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
//   />
// ))}
`

export const FORM_HOOK = `
/**
 * Custom hook for form handling
 */
import { useState, useCallback } from 'react';

interface FormData {
  [key: string]: any;
}

interface FormErrors {
  [key: string]: string;
}

interface UseFormOptions {
  initialValues: FormData;
  validate?: (values: FormData) => FormErrors;
  onSubmit: (values: FormData) => void | Promise<void>;
}

function useForm({ initialValues, validate, onSubmit }: UseFormOptions) {
  const [values, setValues] = useState<FormData>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset
  };
}

// Usage example:
// const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm({
//   initialValues: { email: '', password: '' },
//   validate: (values) => {
//     const errors = {};
//     if (!values.email) errors.email = 'Email is required';
//     if (!values.password) errors.password = 'Password is required';
//     return errors;
//   },
//   onSubmit: async (values) => {
//     await login(values);
//   }
// });
`

export const INFINITE_SCROLL_HOOK = `
/**
 * Custom hook for infinite scrolling
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  fetchMore: () => Promise<any[]>;
  hasMore: boolean;
  threshold?: number;
}

function useInfiniteScroll({ fetchMore, hasMore, threshold = 100 }: UseInfiniteScrollOptions) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newItems = await fetchMore();
      setItems(prev => [...prev, ...newItems]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
    } finally {
      setLoading(false);
    }
  }, [fetchMore, hasMore, loading]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold }
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, loading, threshold]);

  return {
    items,
    loading,
    error,
    loadingRef
  };
}

// Usage example:
// const { items, loading, error, loadingRef } = useInfiniteScroll({
//   fetchMore: async () => {
//     const response = await fetch(\`/api/items?page=\${page}\`);
//     return response.json();
//   },
//   hasMore: page < totalPages
// });
`

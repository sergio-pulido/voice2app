/**
 * JavaScript Snippets - Reusable JavaScript utilities and functions
 */

export const DEBOUNCE_FUNCTION = `
/**
 * Debounce function to limit the rate of function execution
 */
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Usage example:
// const debouncedSearch = debounce((query) => {
//   console.log('Searching for:', query);
// }, 300);
`

export const THROTTLE_FUNCTION = `
/**
 * Throttle function to limit the rate of function execution
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage example:
// const throttledScroll = throttle(() => {
//   console.log('Scrolling...');
// }, 100);
`

export const LOCAL_STORAGE_UTILS = `
/**
 * Local Storage utilities with error handling
 */
const storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
  
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

// Usage example:
// storage.set('user', { name: 'John', age: 30 });
// const user = storage.get('user', {});
// storage.remove('user');
`

export const FETCH_WITH_RETRY = `
/**
 * Fetch with automatic retry logic
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.warn(\`Attempt \${i + 1} failed:\`, error.message);
      
      if (i < maxRetries - 1) {
        // Exponential backoff
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Usage example:
// try {
//   const response = await fetchWithRetry('/api/data');
//   const data = await response.json();
//   console.log(data);
// } catch (error) {
//   console.error('Failed to fetch data:', error);
// }
`

export const FORM_VALIDATION = `
/**
 * Simple form validation utilities
 */
const validator = {
  email(email) {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
  },
  
  password(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },
  
  phone(phone) {
    const phoneRegex = /^[\\+]?[1-9][\\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\\s\\-\\(\\)]/g, ''));
  },
  
  url(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  required(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },
  
  minLength(value, min) {
    return value && value.length >= min;
  },
  
  maxLength(value, max) {
    return value && value.length <= max;
  }
};

// Usage example:
// const isValidEmail = validator.email('user@example.com');
// const isValidPassword = validator.password('MyPassword123');
`

export const DATE_UTILITIES = `
/**
 * Date utility functions
 */
const dateUtils = {
  format(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },
  
  timeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return \`\${days} day\${days > 1 ? 's' : ''} ago\`;
    if (hours > 0) return \`\${hours} hour\${hours > 1 ? 's' : ''} ago\`;
    if (minutes > 0) return \`\${minutes} minute\${minutes > 1 ? 's' : ''} ago\`;
    return 'Just now';
  },
  
  isToday(date) {
    const today = new Date();
    const d = new Date(date);
    return d.toDateString() === today.toDateString();
  },
  
  isThisWeek(date) {
    const today = new Date();
    const d = new Date(date);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo && d <= today;
  }
};

// Usage example:
// const formatted = dateUtils.format(new Date(), 'YYYY-MM-DD HH:mm');
// const timeAgo = dateUtils.timeAgo('2024-01-01');
`

export const ARRAY_UTILITIES = `
/**
 * Array utility functions
 */
const arrayUtils = {
  unique(array) {
    return [...new Set(array)];
  },
  
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },
  
  sortBy(array, key, direction = 'asc') {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (direction === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
  },
  
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  
  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
};

// Usage example:
// const unique = arrayUtils.unique([1, 2, 2, 3, 3, 3]);
// const grouped = arrayUtils.groupBy(users, 'department');
// const sorted = arrayUtils.sortBy(users, 'name', 'desc');
`

export const STRING_UTILITIES = `
/**
 * String utility functions
 */
const stringUtils = {
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },
  
  camelCase(str) {
    return str.replace(/(?:^\\w|[A-Z]|\\b\\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\\s+/g, '');
  },
  
  kebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2')
              .replace(/[\\s_]+/g, '-')
              .toLowerCase();
  },
  
  slugify(str) {
    return str.toLowerCase()
              .replace(/[^a-z0-9 -]/g, '')
              .replace(/\\s+/g, '-')
              .replace(/-+/g, '-')
              .trim('-');
  },
  
  truncate(str, length, suffix = '...') {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  },
  
  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
};

// Usage example:
// const capitalized = stringUtils.capitalize('hello world');
// const camelCased = stringUtils.camelCase('hello world');
// const kebabCased = stringUtils.kebabCase('Hello World');
// const slugified = stringUtils.slugify('Hello, World!');
`

export const EVENT_EMITTER = `
/**
 * Simple Event Emitter implementation
 */
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }
  
  off(event, listener) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(l => l !== listener);
  }
  
  emit(event, ...args) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(listener => {
      listener(...args);
    });
  }
  
  once(event, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }
}

// Usage example:
// const emitter = new EventEmitter();
// emitter.on('user:login', (user) => console.log('User logged in:', user));
// emitter.emit('user:login', { name: 'John' });
`

export const LOADING_STATE_MANAGER = `
/**
 * Loading state manager for async operations
 */
class LoadingManager {
  constructor() {
    this.loadingStates = new Map();
    this.listeners = new Set();
  }
  
  setLoading(key, isLoading) {
    this.loadingStates.set(key, isLoading);
    this.notifyListeners();
  }
  
  isLoading(key) {
    return this.loadingStates.get(key) || false;
  }
  
  isAnyLoading() {
    return Array.from(this.loadingStates.values()).some(loading => loading);
  }
  
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.loadingStates));
  }
  
  async withLoading(key, asyncFn) {
    this.setLoading(key, true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      this.setLoading(key, false);
    }
  }
}

// Usage example:
// const loadingManager = new LoadingManager();
// 
// loadingManager.subscribe((states) => {
//   console.log('Loading states changed:', states);
// });
// 
// await loadingManager.withLoading('fetchData', async () => {
//   const data = await fetch('/api/data');
//   return data.json();
// });
`

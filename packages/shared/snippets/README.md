# Snippets Library

This library contains reusable code snippets organized by type and category. Perfect for templates, fallbacks, and common patterns.

## Structure

```
snippets/
├── index.ts              # Main exports
├── html.ts               # HTML templates and components
├── css.ts                # CSS styles and components
├── javascript.ts         # JavaScript utilities and functions
├── react.ts              # React components and hooks
└── README.md            # This file
```

## Categories

### 🌐 HTML Snippets (`html.ts`)

#### **Fallback App HTML**
- **Purpose**: Simple fallback page when code generation fails
- **Features**: Beautiful gradient background, glassmorphism effect, responsive design
- **Usage**: Used in `getFallbackApp()` function

#### **Hello World HTML**
- **Purpose**: Simple welcome page template
- **Features**: Modern design, gradient background, clean typography
- **Usage**: Perfect for testing or simple landing pages

#### **Email Template HTML**
- **Purpose**: Professional email template with all required sections
- **Features**: 
  - Header with company banner
  - Title and salutation
  - Body content area
  - Call-to-action button
  - Footer with company info
  - CAN-SPAM and GDPR compliance sections
- **Usage**: Marketing emails, notifications, newsletters

#### **Landing Page HTML**
- **Purpose**: Complete landing page template
- **Features**:
  - Hero section with gradient background
  - Features grid layout
  - Call-to-action buttons
  - Responsive design
  - Modern typography
- **Usage**: Product landing pages, service pages

#### **Error Page HTML**
- **Purpose**: Custom error pages (404, 500, etc.)
- **Features**:
  - Error code display
  - Friendly error message
  - Home button navigation
  - Beautiful glassmorphism design
- **Usage**: Custom error pages for web applications

#### **Loading Page HTML**
- **Purpose**: Loading screen template
- **Features**:
  - Animated spinner
  - Gradient background
  - Clean, minimal design
- **Usage**: Loading screens, splash pages

### 🎨 CSS Snippets (`css.ts`)

#### **Glassmorphism Effects**
- Modern glass-like appearance
- Backdrop blur effects
- Semi-transparent backgrounds
- Perfect for modern UI designs

#### **Gradient Backgrounds**
- Beautiful gradient combinations
- Primary, secondary, success, warning, danger variants
- Dark and light theme support
- Ready-to-use CSS classes

#### **Modern Button Styles**
- Primary, secondary, and ghost button variants
- Hover effects and transitions
- Gradient backgrounds
- Professional styling

#### **Card Styles**
- Standard, glass, and gradient card variants
- Hover animations
- Shadow effects
- Responsive design

#### **Form Styles**
- Modern input fields
- Focus states
- Textarea and select styling
- Consistent form design

#### **Animations**
- Fade in, slide in, scale in effects
- Pulse and bounce animations
- Smooth transitions
- Performance-optimized

#### **Responsive Grid System**
- CSS Grid layouts
- Responsive breakpoints
- Flexbox utilities
- Gap spacing classes

#### **Typography**
- Font size hierarchy
- Font weight variations
- Text alignment utilities
- Gradient text effects

#### **Utility Classes**
- Container layouts
- Spacing utilities
- Border radius variants
- Shadow effects

### ⚡ JavaScript Snippets (`javascript.ts`)

#### **Debounce & Throttle**
- Performance optimization functions
- Rate limiting for events
- Smooth user interactions

#### **Local Storage Utils**
- Safe localStorage operations
- Error handling
- JSON serialization
- TypeScript support

#### **Fetch with Retry**
- Automatic retry logic
- Exponential backoff
- Error handling
- Promise-based

#### **Form Validation**
- Email, password, phone validation
- URL validation
- Required field checking
- Length validation

#### **Date Utilities**
- Date formatting
- Time ago calculations
- Date comparisons
- Multiple format support

#### **Array Utilities**
- Unique array filtering
- Group by functionality
- Sorting utilities
- Chunking and shuffling

#### **String Utilities**
- Case conversion (camelCase, kebab-case)
- Text capitalization
- Slug generation
- HTML stripping

#### **Event Emitter**
- Simple event system
- Event subscription
- One-time listeners
- TypeScript support

#### **Loading State Manager**
- Async operation tracking
- State management
- Listener system
- Promise integration

### ⚛️ React Snippets (`react.ts`)

#### **Custom Hooks**

##### **useLocalStorage**
- React state with localStorage persistence
- TypeScript support
- Error handling
- Automatic serialization

##### **useDebounce**
- Debounced values for search
- Performance optimization
- Cleanup handling
- TypeScript support

##### **useFetch**
- Data fetching with loading states
- Error handling
- Request cancellation
- Promise-based

##### **useForm**
- Form state management
- Validation support
- Submission handling
- Error tracking

##### **useInfiniteScroll**
- Infinite scrolling functionality
- Intersection Observer API
- Loading state management
- Performance optimized

#### **Reusable Components**

##### **LoadingSpinner**
- Configurable spinner component
- Size variants (sm, md, lg)
- Color customization
- SVG-based animation

##### **Modal**
- Accessible modal component
- Keyboard navigation (ESC key)
- Backdrop click handling
- Size variants
- Body scroll locking

##### **Toast**
- Notification system
- Type variants (success, error, warning, info)
- Auto-dismiss functionality
- Animation support
- Stack management

## Usage Examples

### Importing Snippets

```typescript
// Import specific snippets
import { FALLBACK_APP_HTML, EMAIL_TEMPLATE_HTML } from '../shared/snippets/html'
import { GLASSMORPHISM_CSS, GRADIENT_BACKGROUNDS_CSS } from '../shared/snippets/css'
import { DEBOUNCE_FUNCTION, LOCAL_STORAGE_UTILS } from '../shared/snippets/javascript'
import { useLocalStorage, LoadingSpinner } from '../shared/snippets/react'

// Import all snippets
import * as snippets from '../shared/snippets'
```

### Using HTML Snippets

```typescript
// Use fallback HTML
const fallbackApp = {
  path: 'index.html',
  content: FALLBACK_APP_HTML
}

// Use email template with placeholders
const emailContent = EMAIL_TEMPLATE_HTML
  .replace('{{COMPANY_NAME}}', 'My Company')
  .replace('{{EMAIL_TITLE}}', 'Welcome!')
  .replace('{{RECIPIENT_NAME}}', 'John Doe')
```

### Using CSS Snippets

```css
/* Include CSS snippets in your styles */
@import url('./snippets/css/glassmorphism.css');
@import url('./snippets/css/gradients.css');

/* Use utility classes */
.my-card {
  @apply .glass .rounded-xl .p-6;
}
```

### Using JavaScript Snippets

```javascript
// Use utility functions
const debouncedSearch = debounce((query) => {
  console.log('Searching for:', query);
}, 300);

// Use storage utilities
storage.set('user', { name: 'John', age: 30 });
const user = storage.get('user', {});
```

### Using React Snippets

```tsx
// Use custom hooks
const [user, setUser] = useLocalStorage('user', null);
const debouncedSearchTerm = useDebounce(searchTerm, 500);

// Use components
<LoadingSpinner size="lg" color="#667eea" />
<Modal isOpen={isOpen} onClose={onClose} title="Confirm">
  <p>Are you sure?</p>
</Modal>
```

## Benefits

### 🎯 **Reusability**
- Write once, use everywhere
- Consistent patterns across projects
- Reduced code duplication

### 🔧 **Maintainability**
- Centralized code management
- Easy updates and improvements
- Version control for snippets

### 🚀 **Productivity**
- Quick implementation of common patterns
- Pre-tested and optimized code
- TypeScript support

### 📈 **Quality**
- Best practices included
- Error handling built-in
- Performance optimized

## Adding New Snippets

### 1. Choose the Right Category
- **HTML**: Templates, layouts, components
- **CSS**: Styles, animations, utilities
- **JavaScript**: Functions, utilities, classes
- **React**: Hooks, components, patterns

### 2. Add Your Snippet
```typescript
// In the appropriate file (e.g., html.ts)
export const MY_NEW_SNIPPET = \`
<!-- Your HTML template here -->
\`;
```

### 3. Export from Index
```typescript
// In index.ts
export * from './html'
export * from './css'
export * from './javascript'
export * from './react'
```

### 4. Document Usage
- Add JSDoc comments
- Include usage examples
- Update this README

## Best Practices

### 📝 **Writing Snippets**
- Use clear, descriptive names
- Include comprehensive comments
- Follow consistent formatting
- Add TypeScript types when applicable

### 🏗️ **Template Structure**
- Use placeholder variables ({{VARIABLE_NAME}})
- Include all necessary dependencies
- Make templates self-contained
- Test thoroughly

### 🔄 **Maintenance**
- Keep snippets up-to-date
- Remove deprecated code
- Add new patterns regularly
- Document changes

## Future Enhancements

- **Snippet Categories**: Organize by domain (auth, payment, etc.)
- **Template Engine**: Dynamic template processing
- **Validation**: Snippet quality checks
- **Search**: Find snippets by functionality
- **Testing**: Automated snippet testing
- **Documentation**: Interactive snippet browser

---

This snippets library makes development faster, more consistent, and more maintainable. All snippets are production-ready and follow best practices! 🚀

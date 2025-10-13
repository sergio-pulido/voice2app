# Template Usage Examples

This document provides practical examples of how the Voice2App code agent uses templates and snippets.

## 🎯 How It Works

The code agent uses a **template-first approach**:

1. **Template Detection**: Checks if the user's request matches a known template
2. **Smart Generation**: If matched, generates from template with intelligent placeholder filling
3. **LLM Fallback**: If no template match, uses LLM for custom code generation
4. **Template Hints**: Even during LLM generation, provides hints about available templates

## 📧 Example 1: Email Template Request

### User Request:
```
"Create a marketing email template for our company 'TechCorp' with a welcome message and a 'Get Started' button"
```

### What Happens:

1. **Detection**: Template handler detects keywords: "email template", "marketing email"
2. **Template Match**: Selects `EMAIL_TEMPLATE_HTML`
3. **Smart Extraction**: Extracts values from context:
   - Company: "TechCorp"
   - CTA: "Get Started"
4. **Generation**: Fills template with extracted values
5. **Output**: 
   ```
   ✅ Generated from template!
   📄 index.html - Professional email template
   📄 README.md - Usage instructions with remaining placeholders
   ```

### Generated Files:

**index.html** (excerpt):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome Email</title>
  ...
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>TechCorp</h1>
    </div>
    <div class="content">
      <h2 class="title">Welcome!</h2>
      <p class="salutation">Hello {{RECIPIENT_NAME}},</p>
      <div class="body">
        Thank you for being a valued customer...
      </div>
      <div class="cta">
        <a href="{{CTA_URL}}" class="cta-button">Get Started</a>
      </div>
      ...
    </div>
  </div>
</body>
</html>
```

**README.md** (excerpt):
```markdown
# Email Template

## Customized Values

- `{{COMPANY_NAME}}` → "TechCorp"
- `{{CTA_TEXT}}` → "Get Started"

## Remaining Placeholders

- `{{RECIPIENT_NAME}}` - Recipient's name
- `{{CTA_URL}}` - Call-to-action link

## Features

✅ CAN-SPAM and GDPR compliant
✅ Responsive design
✅ Beautiful styling
```

## 🌐 Example 2: Landing Page Request

### User Request:
```
"Build a landing page for our new SaaS product 'CloudFlow'. Hero title: 'Automate Your Workflow'. Features: Fast, Secure, Easy to Use"
```

### What Happens:

1. **Detection**: Matches "landing page" keyword
2. **Template**: Uses `LANDING_PAGE_HTML`
3. **Extraction**:
   - Product: "CloudFlow"
   - Hero Title: "Automate Your Workflow"
   - Features: "Fast", "Secure", "Easy to Use"
4. **Smart Filling**: Populates all relevant fields

### Generated Output:

```html
<section class="hero">
  <h1>Automate Your Workflow</h1>
  <p>The best solution for your needs</p>
  <a href="#signup" class="cta-button">Get Started</a>
</section>

<section class="features">
  <h2>Why Choose Us?</h2>
  <div class="feature-grid">
    <div class="feature">
      <h3>Fast</h3>
      <p>Lightning-fast performance you can count on</p>
    </div>
    <div class="feature">
      <h3>Secure</h3>
      <p>Your data is always protected</p>
    </div>
    <div class="feature">
      <h3>Easy to Use</h3>
      <p>Intuitive interface that anyone can master</p>
    </div>
  </div>
</section>
```

## ❌ Example 3: Error Page Request

### User Request:
```
"Create a 404 error page that says 'Oops! This page doesn't exist'"
```

### Generated Output:

```html
<div class="error-container">
  <div class="error-code">404</div>
  <h1 class="error-title">Page Not Found</h1>
  <p class="error-message">Oops! This page doesn't exist</p>
  <a href="/" class="home-button">Go Home</a>
</div>
```

## 🔄 Example 4: LLM Generation with Template Hints

### User Request:
```
"Create a React todo app with authentication"
```

### What Happens:

1. **Template Check**: No exact template match (complex app)
2. **LLM Generation**: Falls back to LLM
3. **Template Hints**: System prompt includes:
   ```
   📋 AVAILABLE TEMPLATES:
   
   **EMAIL**
   Professional email template with header, CTA, footer...
   
   **LANDING_PAGE**
   Complete landing page with hero section...
   
   💡 You can reference these templates for structure and styling.
   ```
4. **LLM Benefits**: 
   - Knows about available templates
   - Can use similar styling patterns
   - Understands design standards

### Result:
Custom React app with styling inspired by template patterns:
- Glassmorphism effects
- Gradient backgrounds
- Modern button styles
- Professional layout

## 🎨 Example 5: CSS Snippets Usage

### Scenario: LLM generates a custom app

The LLM can reference CSS snippets in generated files:

**Generated styles.css**:
```css
/* Using snippet patterns */
.app-container {
  /* Inspired by GLASSMORPHISM_CSS */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.primary-button {
  /* Using MODERN_BUTTONS_CSS pattern */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  transition: all 0.3s ease;
}
```

## ⚛️ Example 6: React Components

### User Request:
```
"Create a React app with a loading spinner and modal"
```

### Generated Output:

**LoadingSpinner.tsx** (from snippet):
```tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'currentColor' 
}) => {
  // Complete component from LOADING_SPINNER_COMPONENT snippet
  ...
}
```

**Modal.tsx** (from snippet):
```tsx
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Complete component from MODAL_COMPONENT snippet
  ...
}
```

## 🔧 Example 7: JavaScript Utilities

### User Request:
```
"Create a form with validation and localStorage persistence"
```

### Generated utils.js:

```javascript
// Validation utilities (from FORM_VALIDATION snippet)
const validator = {
  email(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  password(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }
};

// Storage utilities (from LOCAL_STORAGE_UTILS snippet)
const storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving:', error);
      return false;
    }
  },
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }
};
```

## 📊 Template Usage Flow

```
User Request
    ↓
Template Detection
    ↓
┌─────────────────┐
│  Match Found?   │
└─────────────────┘
    ↓           ↓
   Yes          No
    ↓           ↓
Template      LLM Generation
Generation    (with template hints)
    ↓           ↓
Smart Filling  Custom Code
    ↓           ↓
Generate Files Generate Files
    ↓           ↓
Add README     Beautiful UI
    ↓           ↓
    └───────────┘
         ↓
    Return Files
```

## 🎯 Best Practices

### 1. Template Requests (Fast & Consistent)
```
✅ "Create an email template for our newsletter"
✅ "Build a landing page for our product"
✅ "Make a 404 error page"
```

### 2. Custom Requests (Flexible & Unique)
```
✅ "Build a todo app with drag and drop"
✅ "Create a dashboard with charts"
✅ "Make a chat application"
```

### 3. Hybrid Requests (Best of Both)
```
✅ "Create a landing page with a signup form and todo list"
   → Uses landing page template + custom form
   
✅ "Email template with a custom product showcase section"
   → Uses email template + adds custom section
```

## 🚀 Advanced Examples

### Multi-Template Detection

```typescript
// Request: "Create a website with a landing page and error pages"

// System detects multiple templates:
// 1. Landing page template
// 2. Error page template

// Generates:
// - index.html (landing page)
// - 404.html (error page)
// - 500.html (error page)
// - README.md (usage guide)
```

### Template + LLM Hybrid

```typescript
// Request: "Email template with dynamic product recommendations"

// Flow:
// 1. Use EMAIL_TEMPLATE_HTML as base
// 2. Ask LLM to add product recommendation section
// 3. Merge template + custom section
// 4. Return enhanced template
```

## 💡 Tips for Users

### To Get Template Generation:
- Use template keywords: "template", "page", "email", "landing", "error"
- Be specific: "email template" vs just "email"
- Mention template type: "marketing email", "transactional email"

### To Get Custom Generation:
- Request unique features
- Ask for complex interactions
- Specify custom business logic

### To Get Best Results:
- Provide context: company name, product details
- Specify content: hero title, features, CTA text
- Mention preferences: colors, style, layout

---

The template system makes code generation **faster**, **more consistent**, and **higher quality**! 🎨✨

/**
 * HTML Snippets - Reusable HTML templates and components
 */

export const FALLBACK_APP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App Generated</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 2rem;
      text-align: center;
      color: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    h1 {
      margin: 0 0 1rem 0;
      font-size: 2rem;
    }
    p {
      margin: 0;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>App Generated</h1>
    <p>Your app has been created successfully!</p>
  </div>
</body>
</html>`

export const HELLO_WORLD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 3rem;
      text-align: center;
      color: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    h1 {
      margin: 0 0 1rem 0;
      font-size: 3rem;
      font-weight: bold;
    }
    p {
      margin: 0;
      opacity: 0.9;
      font-size: 1.2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello World! 🌍</h1>
    <p>Welcome to your new application!</p>
  </div>
</body>
</html>`

export const EMAIL_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{EMAIL_TITLE}}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }
    .content {
      padding: 30px 20px;
    }
    .title {
      font-size: 28px;
      font-weight: bold;
      color: #2d3748;
      margin: 0 0 20px 0;
    }
    .salutation {
      font-size: 16px;
      margin: 0 0 20px 0;
    }
    .body {
      font-size: 16px;
      margin: 0 0 30px 0;
      line-height: 1.7;
    }
    .cta {
      text-align: center;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .closing {
      font-size: 16px;
      margin: 30px 0 0 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #6c757d;
      border-top: 1px solid #e9ecef;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .legal {
      font-size: 12px;
      color: #6c757d;
      margin-top: 15px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with Banner -->
    <div class="header">
      <h1>{{COMPANY_NAME}}</h1>
    </div>
    
    <!-- Main Content -->
    <div class="content">
      <h2 class="title">{{EMAIL_TITLE}}</h2>
      
      <p class="salutation">Hello {{RECIPIENT_NAME}},</p>
      
      <div class="body">
        {{EMAIL_BODY}}
      </div>
      
      <!-- Call to Action -->
      <div class="cta">
        <a href="{{CTA_URL}}" class="cta-button">{{CTA_TEXT}}</a>
      </div>
      
      <p class="closing">
        {{CLOSING_MESSAGE}}
      </p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>
        <strong>{{COMPANY_NAME}}</strong><br>
        {{COMPANY_ADDRESS}}<br>
        <a href="{{COMPANY_WEBSITE}}">{{COMPANY_WEBSITE}}</a>
      </p>
      
      <div class="legal">
        <p>
          You received this email because you signed up for our service. 
          If you no longer wish to receive these emails, you can 
          <a href="{{UNSUBSCRIBE_URL}}">unsubscribe here</a>.
        </p>
        <p>
          This email complies with CAN-SPAM Act and GDPR regulations. 
          For privacy concerns, contact us at {{PRIVACY_EMAIL}}.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`

export const LANDING_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{PAGE_TITLE}}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 100px 20px;
      text-align: center;
    }
    .hero h1 {
      font-size: 3.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }
    .hero p {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    .cta-button {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      font-size: 1.1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s;
    }
    .cta-button:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
    .features {
      padding: 80px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .features h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 3rem;
      color: #2d3748;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }
    .feature {
      text-align: center;
      padding: 2rem;
      border-radius: 8px;
      background: #f8f9fa;
    }
    .feature h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #2d3748;
    }
    .footer {
      background: #2d3748;
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <!-- Hero Section -->
  <section class="hero">
    <h1>{{HERO_TITLE}}</h1>
    <p>{{HERO_SUBTITLE}}</p>
    <a href="{{CTA_URL}}" class="cta-button">{{CTA_TEXT}}</a>
  </section>
  
  <!-- Features Section -->
  <section class="features">
    <h2>Why Choose Us?</h2>
    <div class="feature-grid">
      <div class="feature">
        <h3>{{FEATURE_1_TITLE}}</h3>
        <p>{{FEATURE_1_DESCRIPTION}}</p>
      </div>
      <div class="feature">
        <h3>{{FEATURE_2_TITLE}}</h3>
        <p>{{FEATURE_2_DESCRIPTION}}</p>
      </div>
      <div class="feature">
        <h3>{{FEATURE_3_TITLE}}</h3>
        <p>{{FEATURE_3_DESCRIPTION}}</p>
      </div>
    </div>
  </section>
  
  <!-- Footer -->
  <footer class="footer">
    <p>&copy; 2024 {{COMPANY_NAME}}. All rights reserved.</p>
  </footer>
</body>
</html>`

export const ERROR_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ERROR_TITLE}}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .error-container {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 3rem;
      text-align: center;
      color: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      max-width: 500px;
    }
    .error-code {
      font-size: 4rem;
      font-weight: bold;
      margin-bottom: 1rem;
      color: #ff6b6b;
    }
    .error-title {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    .error-message {
      font-size: 1.1rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    .home-button {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      border: 2px solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s;
    }
    .home-button:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-code">{{ERROR_CODE}}</div>
    <h1 class="error-title">{{ERROR_TITLE}}</h1>
    <p class="error-message">{{ERROR_MESSAGE}}</p>
    <a href="{{HOME_URL}}" class="home-button">Go Home</a>
  </div>
</body>
</html>`

export const LOADING_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading...</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .loading-container {
      text-align: center;
      color: white;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .loading-text {
      font-size: 1.2rem;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="loading-container">
    <div class="spinner"></div>
    <div class="loading-text">Loading...</div>
  </div>
</body>
</html>`

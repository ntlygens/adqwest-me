// import { bootstrapApplication } from '@angular/platform-browser';
// import { appConfig } from './app/app.config';
// import { App } from './app/app';

// bootstrapApplication(App, appConfig)
//   .catch((err) => console.error(err));





import { Context, Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS
app.use('*', cors());

// ==================== API ROUTES ====================

// GET: Fetch demo content for vertical
app.get('/api/demo-content/:vertical', async (c: Context) => {
  const { vertical } = c.req.param();
  
  try {
    const content = await c.env.DB.prepare(
      'SELECT * FROM demo_content WHERE vertical = ? ORDER BY id'
    ).bind(vertical).all();
    
    return c.json({ success: true, data: content.results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, error: message }, 500);
  }
});

// POST: Admin login
app.post('/api/login', async (c: Context) => {
  const { username, password } = await c.req.json();
  
  try {
    const user = await c.env.DB.prepare(
      'SELECT * FROM admin_logins WHERE username = ?'
    ).bind(username).first();
    
    // For demo: simple password check (use bcrypt in production)
    if (user && password === 'demo123') {
      return c.json({ 
        success: true, 
        token: btoa(`${username}:${Date.now()}`),
        vertical: user.vertical
      });
    }
    
    return c.json({ success: false, error: 'Invalid credentials' }, 401);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, error: message }, 500);
  }
});

// POST: Submit demo request
app.post('/api/demo-request', async (c: Context) => {
  const { email, company, vertical, name, phone, message } = await c.req.json();
  
  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO demo_requests (email, company, vertical, name, phone, message) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(email, company, vertical, name, phone, message).run();
    
    // Send email notification (using Cloudflare Email Routing)
    // Note: Configure Email Routing in Cloudflare dashboard first
    await sendEmail({
      to: email,
      subject: 'Adqwest-ME Demo Request Received',
      html: `
        <h2>Thank you for your interest!</h2>
        <p>Hi ${name},</p>
        <p>We received your demo request for Adqwest-ME. Our team will contact you within 24 hours.</p>
        <p>Company: ${company}</p>
        <p>Vertical: ${vertical}</p>
        <hr/>
        <p>Questions? Reply to this email or call us.</p>
      `
    });
    
    // Send internal notification
    await sendEmail({
      to: 'admin@adqwestme.com',
      subject: `New Demo Request: ${company}`,
      html: `
        <h2>New Demo Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Vertical:</strong> ${vertical}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
      `
    });
    
    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, error: message }, 500);
  }
});

// GET: Fetch all demo requests (admin only)
app.get('/api/demo-requests', async (c: Context) => {
  const auth = c.req.header('Authorization');
  
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  try {
    const requests = await c.env.DB.prepare(
      'SELECT * FROM demo_requests ORDER BY created_at DESC'
    ).all();
    
    return c.json({ success: true, data: requests.results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, error: message }, 500);
  }
});

// ==================== STATIC ASSETS ====================

// Serve the React SPA
app.get('*', async (c: any) => {
  // This will serve index.html (built React app)
  return c.html(getIndexHTML());
});


async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
     const response = await fetch('https://api.resend.com/emails', {
       method: 'POST',
       headers: {
         'Authorization': 'Bearer \${c.env.RESEND_API_KEY}',
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ from: 'noreply@adqwestme.com', to, subject, html })
     });
     return response.ok;
   }



// Simple email function (uses Cloudflare's Email Routing)
// async function sendEmail({ to, subject, html }) {
//   // Configure in Cloudflare dashboard: Email Routing
//   // For now, log to console (you'll set up real email in dashboard)
//   console.log(`Email to ${to}: ${subject}`);
//   return true;
// }




export default app;

// ==================== HTML TEMPLATE ====================

function getIndexHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Adqwest-ME | Smart Media Solutions for Every Vertical</title>
  <style>${getStyles()}</style>
</head>
<body>
  <div id="root"></div>
  <script>${getAppJS()}</script>
</body>
</html>
  `;
}

function getStyles() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.6; }
    
    :root {
      --primary: #0066FF;
      --secondary: #00D4FF;
      --dark: #0a0e27;
      --light: #f8f9fa;
      --accent: #FF6B35;
    }
    
    /* Navigation */
    .navbar {
      background: white;
      padding: 1.5rem 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    .navbar-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .nav-links {
      display: flex;
      gap: 2rem;
      list-style: none;
    }
    
    .nav-links a {
      text-decoration: none;
      color: #333;
      font-weight: 500;
      transition: color 0.3s;
    }
    
    .nav-links a:hover {
      color: var(--primary);
    }
    
    /* Hero Section */
    .hero {
      background: linear-gradient(135deg, var(--dark) 0%, #1a2d5a 100%);
      color: white;
      padding: 6rem 2rem;
      text-align: center;
    }
    
    .hero-content {
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .hero h1 {
      font-size: 3.5rem;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }
    
    .hero p {
      font-size: 1.3rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    
    .hero-button {
      display: inline-block;
      background: var(--primary);
      color: white;
      padding: 1rem 2.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      transition: all 0.3s;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
    }
    
    .hero-button:hover {
      background: var(--secondary);
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0,102,255,0.3);
    }
    
    /* Sections */
    .section {
      padding: 4rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .section-title {
      font-size: 2.5rem;
      margin-bottom: 3rem;
      text-align: center;
      color: var(--dark);
    }
    
    /* Verticals */
    .verticals {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
    }
    
    .vertical-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 5px 20px rgba(0,0,0,0.08);
      transition: all 0.3s;
      cursor: pointer;
      border: 2px solid transparent;
    }
    
    .vertical-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.15);
      border-color: var(--primary);
    }
    
    .vertical-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    .vertical-card h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: var(--dark);
    }
    
    .vertical-card p {
      color: #666;
      margin-bottom: 1.5rem;
    }
    
    .vertical-button {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s;
    }
    
    .vertical-button:hover {
      transform: scale(1.05);
    }
    
    /* Pricing */
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }
    
    .pricing-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      border: 2px solid #eee;
      text-align: center;
      transition: all 0.3s;
    }
    
    .pricing-card.featured {
      border-color: var(--primary);
      box-shadow: 0 10px 30px rgba(0,102,255,0.2);
      transform: scale(1.05);
    }
    
    .pricing-card:hover {
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }
    
    .price {
      font-size: 2.5rem;
      font-weight: bold;
      color: var(--primary);
      margin: 1rem 0;
    }
    
    .price-period {
      color: #666;
      font-size: 1rem;
    }
    
    .features {
      list-style: none;
      text-align: left;
      margin: 2rem 0;
      color: #666;
    }
    
    .features li {
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }
    
    .features li:before {
      content: "✓ ";
      color: var(--primary);
      font-weight: bold;
      margin-right: 0.5rem;
    }
    
    .pricing-button {
      background: var(--primary);
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      width: 100%;
      margin-top: 1.5rem;
      transition: all 0.3s;
    }
    
    .pricing-button:hover {
      background: var(--secondary);
    }
    
    /* Testimonials */
    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }
    
    .testimonial {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      border-left: 4px solid var(--primary);
      box-shadow: 0 5px 15px rgba(0,0,0,0.08);
    }
    
    .testimonial-text {
      margin-bottom: 1.5rem;
      color: #333;
      font-style: italic;
    }
    
    .testimonial-author {
      font-weight: bold;
      color: var(--dark);
    }
    
    .testimonial-role {
      color: #666;
      font-size: 0.9rem;
    }
    
    /* Modal */
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    
    .modal.active {
      display: flex;
    }
    
    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    .modal-close {
      float: right;
      font-size: 2rem;
      cursor: pointer;
      color: #999;
    }
    
    .modal-close:hover {
      color: #333;
    }
    
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
      color: var(--dark);
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      font-family: inherit;
    }
    
    .form-group textarea {
      resize: vertical;
      min-height: 100px;
    }
    
    .submit-button {
      background: var(--primary);
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      width: 100%;
      font-size: 1rem;
      transition: all 0.3s;
    }
    
    .submit-button:hover {
      background: var(--secondary);
    }
    
    /* Demo Dashboard */
    .demo-dashboard {
      display: none;
    }
    
    .demo-dashboard.active {
      display: block;
    }
    
    .dashboard-header {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      padding: 2rem;
      margin-bottom: 2rem;
      border-radius: 12px;
    }
    
    .dashboard-content {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.08);
    }
    
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    
    .demo-item {
      background: var(--light);
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #ddd;
    }
    
    /* Footer */
    .footer {
      background: var(--dark);
      color: white;
      padding: 3rem 2rem;
      text-align: center;
    }
    
    .footer-content {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    @media (max-width: 768px) {
      .hero h1 { font-size: 2rem; }
      .nav-links { gap: 1rem; font-size: 0.9rem; }
      .section { padding: 2rem 1rem; }
    }
  `;
}

function getAppJS() {
  return `
    // Mock data for demo
    const DEMO_CONTENT = {
      schools: [
        { id: 1, title: 'Live News Feed', description: 'Current events and educational content' },
        { id: 2, title: 'Curriculum Integration', description: 'Aligned with educational standards' },
        { id: 3, title: 'Student Announcements', description: 'Campus-wide messaging' },
      ],
      senior_living: [
        { id: 1, title: 'Easy Navigation', description: 'Large buttons, simple interface' },
        { id: 2, title: 'Health & Wellness', description: 'Curated content for active seniors' },
        { id: 3, title: 'Community Events', description: 'Facility announcements & schedules' },
      ],
      hotels: [
        { id: 1, title: 'Guest Entertainment', description: 'Premium entertainment packages' },
        { id: 2, title: 'Local Guides', description: 'Neighborhood info & recommendations' },
        { id: 3, title: 'Room Controls', description: 'Integrated with room management' },
      ],
    };
    
    const TESTIMONIALS = [
      {
        text: "Adqwest reduced our content management time by 60%. Our students love the curated content.",
        author: "Dr. Sarah Johnson",
        role: "Principal, Lincoln High School",
        vertical: "schools"
      },
      {
        text: "Our residents are more engaged than ever. The interface is so easy to use.",
        author: "Michael Chen",
        role: "Facilities Director, Sunrise Senior Living",
        vertical: "senior_living"
      },
      {
        text: "Guest satisfaction scores increased 40% after implementing Adqwest in our rooms.",
        author: "Jessica Martinez",
        role: "General Manager, Downtown Hilton",
        vertical: "hotels"
      },
      {
        text: "The automated content curation is a game-changer for our multi-location strategy.",
        author: "Robert Thompson",
        role: "VP Operations, Elite Hotel Group",
        vertical: "hotels"
      },
    ];
    
    // Simple state management
    let currentView = 'home';
    let currentVertical = null;
    let isLoggedIn = false;
    
    function init() {
      renderHome();
      setupEventListeners();
    }
    
    function setupEventListeners() {
      // Navigation
      document.addEventListener('click', (e) => {
        if (e.target.closest('[data-nav]')) {
          const section = e.target.closest('[data-nav]').dataset.nav;
          navigateTo(section);
        }
        
        if (e.target.closest('[data-vertical]')) {
          const vertical = e.target.closest('[data-vertical]').dataset.vertical;
          showDemoRequest(vertical);
        }
        
        if (e.target.closest('.modal-close')) {
          closeModal();
        }
        
        if (e.target.id === 'demoForm') {
          e.preventDefault();
          submitDemoRequest();
        }
      });
    }
    
    function navigateTo(section) {
      currentView = section;
      const root = document.getElementById('root');
      
      switch(section) {
        case 'home':
          renderHome();
          break;
        case 'demo':
          renderDemo();
          break;
        case 'pricing':
          renderPricing();
          break;
        case 'contact':
          showDemoRequest('general');
          break;
        default:
          renderHome();
      }
    }
    
    function renderHome() {
      const root = document.getElementById('root');
      root.innerHTML = \`
        <nav class="navbar">
          <div class="navbar-content">
            <div class="logo">🚀 Adqwest-ME</div>
            <ul class="nav-links">
              <li><a href="#" data-nav="home">Home</a></li>
              <li><a href="#" data-nav="demo">Demo</a></li>
              <li><a href="#" data-nav="pricing">Pricing</a></li>
              <li><a href="#" data-nav="contact">Contact</a></li>
            </ul>
          </div>
        </nav>
        
        <section class="hero">
          <div class="hero-content">
            <h1>Smart Media Solutions for Every Vertical</h1>
            <p>Curated content, seamless integration, complete control. Schools. Senior Living. Hospitality.</p>
            <button class="hero-button" data-nav="demo">Explore Demo</button>
          </div>
        </section>
        
        <section class="section">
          <h2 class="section-title">Choose Your Vertical</h2>
          <div class="verticals">
            <div class="vertical-card" data-vertical="schools">
              <div class="vertical-icon">🎓</div>
              <h3>Schools & Education</h3>
              <p>Engage students with curriculum-aligned, curated content delivered seamlessly across campus.</p>
              <button class="vertical-button">View Demo</button>
            </div>
            
            <div class="vertical-card" data-vertical="senior_living">
              <div class="vertical-icon">❤️</div>
              <h3>Senior Living</h3>
              <p>Accessible content designed for active seniors. Easy interface, relevant programming.</p>
              <button class="vertical-button">View Demo</button>
            </div>
            
            <div class="vertical-card" data-vertical="hotels">
              <div class="vertical-icon">🏨</div>
              <h3>Hotels & Hospitality</h3>
              <p>Guest-ready entertainment, local guides, and integrated room controls.</p>
              <button class="vertical-button">View Demo</button>
            </div>
          </div>
        </section>
        
        <section class="section" style="background: var(--light);">
          <h2 class="section-title">Why Adqwest-ME</h2>
          <div class="verticals">
            <div style="text-align: center;">
              <h3 style="color: var(--primary); margin-bottom: 1rem;">⚡ Lightning Fast</h3>
              <p>Content delivery on global edge. Always responsive, always available.</p>
            </div>
            <div style="text-align: center;">
              <h3 style="color: var(--primary); margin-bottom: 1rem;">🎯 Fully Customizable</h3>
              <p>Tailor every aspect to match your organization's needs and branding.</p>
            </div>
            <div style="text-align: center;">
              <h3 style="color: var(--primary); margin-bottom: 1rem;">🔒 Secure & Compliant</h3>
              <p>Enterprise-grade security. Your data, your control.</p>
            </div>
          </div>
        </section>
        
        <section class="section">
          <h2 class="section-title">What Our Users Say</h2>
          <div class="testimonials-grid">
            \${TESTIMONIALS.map(t => \`
              <div class="testimonial">
                <div class="testimonial-text">"\${t.text}"</div>
                <div class="testimonial-author">\${t.author}</div>
                <div class="testimonial-role">\${t.role}</div>
              </div>
            \`).join('')}
          </div>
        </section>
        
        <footer class="footer">
          <div class="footer-content">
            <h3>Adqwest-ME</h3>
            <p style="margin-top: 1rem;">Smart Media Solutions for Schools, Senior Living, and Hospitality</p>
            <p style="margin-top: 2rem; opacity: 0.7;">© 2026 Adqwest-ME. All rights reserved.</p>
          </div>
        </footer>
      \`;
      setupEventListeners();
    }
    
    function renderDemo() {
      const root = document.getElementById('root');
      root.innerHTML = \`
        <nav class="navbar">
          <div class="navbar-content">
            <div class="logo">🚀 Adqwest-ME</div>
            <ul class="nav-links">
              <li><a href="#" data-nav="home">Home</a></li>
              <li><a href="#" data-nav="demo">Demo</a></li>
              <li><a href="#" data-nav="pricing">Pricing</a></li>
              <li><a href="#" data-nav="contact">Contact</a></li>
            </ul>
          </div>
        </nav>
        
        <section class="section">
          <h2 class="section-title">Interactive Platform Demo</h2>
          <p style="text-align: center; margin-bottom: 2rem; color: #666;">
            Explore how Adqwest-ME works for your vertical. Choose one to see the admin dashboard in action.
          </p>
          
          <div class="verticals" style="margin-bottom: 3rem;">
            <div class="vertical-card" data-vertical="schools">
              <div class="vertical-icon">🎓</div>
              <h3>Schools</h3>
              <p>See how schools manage student content</p>
              <button class="vertical-button">Load Demo</button>
            </div>
            <div class="vertical-card" data-vertical="senior_living">
              <div class="vertical-icon">❤️</div>
              <h3>Senior Living</h3>
              <p>View senior-friendly interface</p>
              <button class="vertical-button">Load Demo</button>
            </div>
            <div class="vertical-card" data-vertical="hotels">
              <div class="vertical-icon">🏨</div>
              <h3>Hotels</h3>
              <p>Explore guest-facing dashboard</p>
              <button class="vertical-button">Load Demo</button>
            </div>
          </div>
          
          <div id="demoContent" style="display: none;">
            <div class="dashboard-header">
              <h2>Admin Dashboard - <span id="demoTitle"></span></h2>
              <p>This is what your management interface looks like. Full control, simple to use.</p>
            </div>
            
            <div class="dashboard-content">
              <h3 style="margin-bottom: 1.5rem;">Content Library</h3>
              <div class="demo-grid" id="demoGrid"></div>
            </div>
          </div>
        </section>
        
        <footer class="footer">
          <div class="footer-content">
            <p>Ready for a full demo? <a href="#" data-nav="contact" style="color: var(--secondary);">Schedule a meeting</a> with our team.</p>
          </div>
        </footer>
      \`;
      setupEventListeners();
    }
    
    function renderPricing() {
      const root = document.getElementById('root');
      root.innerHTML = \`
        <nav class="navbar">
          <div class="navbar-content">
            <div class="logo">🚀 Adqwest-ME</div>
            <ul class="nav-links">
              <li><a href="#" data-nav="home">Home</a></li>
              <li><a href="#" data-nav="demo">Demo</a></li>
              <li><a href="#" data-nav="pricing">Pricing</a></li>
              <li><a href="#" data-nav="contact">Contact</a></li>
            </ul>
          </div>
        </nav>
        
        <section class="section">
          <h2 class="section-title">Flexible Pricing for Every Size</h2>
          <p style="text-align: center; margin-bottom: 3rem; color: #666; font-size: 1.1rem;">
            Start with what you need. Scale as you grow. Custom solutions available.
          </p>
          
          <div class="pricing-grid">
            <div class="pricing-card">
              <h3>Starter</h3>
              <div class="price">\$399<span class="price-period">/month</span></div>
              <p style="color: #666; margin-bottom: 1.5rem;">Perfect for smaller organizations</p>
              <ul class="features">
                <li>Up to 5 locations</li>
                <li>Basic content curation</li>
                <li>24/7 support</li>
                <li>Monthly updates</li>
              </ul>
              <button class="pricing-button" data-vertical="starter">Get Started</button>
            </div>
            
            <div class="pricing-card featured">
              <h3>Professional</h3>
              <div class="price">\$899<span class="price-period">/month</span></div>
              <p style="color: #666; margin-bottom: 1.5rem;">Most popular choice</p>
              <ul class="features">
                <li>Up to 25 locations</li>
                <li>Advanced AI curation</li>
                <li>Priority support</li>
                <li>Weekly updates</li>
                <li>Custom branding</li>
                <li>Analytics dashboard</li>
              </ul>
              <button class="pricing-button" data-vertical="professional">Get Started</button>
            </div>
            
            <div class="pricing-card">
              <h3>Enterprise</h3>
              <div class="price">Custom<span class="price-period">/month</span></div>
              <p style="color: #666; margin-bottom: 1.5rem;">For large-scale deployments</p>
              <ul class="features">
                <li>Unlimited locations</li>
                <li>Full API access</li>
                <li>Dedicated account manager</li>
                <li>Real-time support</li>
                <li>Custom integrations</li>
                <li>SLA guarantees</li>
              </ul>
              <button class="pricing-button" data-vertical="enterprise">Contact Sales</button>
            </div>
          </div>
          
          <div style="background: var(--light); padding: 2rem; border-radius: 12px; margin-top: 3rem; text-align: center;">
            <h3 style="color: var(--dark); margin-bottom: 1rem;">Questions About Pricing?</h3>
            <p style="color: #666; margin-bottom: 1.5rem;">Every organization is unique. We'll work with you to find the perfect plan.</p>
            <button class="pricing-button" style="max-width: 300px; margin: 0 auto; display: block;" data-nav="contact">Schedule a Demo</button>
          </div>
        </section>
        
        <footer class="footer">
          <div class="footer-content">
            <p>All plans include 30-day free trial. No credit card required.</p>
          </div>
        </footer>
      \`;
      setupEventListeners();
    }
    
    function showDemoRequest(vertical) {
      const modal = document.getElementById('demoModal');
      if (!modal) {
        createModal();
      }
      
      document.getElementById('demoVertical').value = vertical || '';
      document.getElementById('demoModal').classList.add('active');
    }
    
    function createModal() {
      const modal = document.createElement('div');
      modal.id = 'demoModal';
      modal.className = 'modal';
      modal.innerHTML = \`
        <div class="modal-content">
          <span class="modal-close">&times;</span>
          <h2 style="margin-bottom: 1.5rem; color: var(--dark);">Schedule Your Demo</h2>
          <form id="demoForm">
            <div class="form-group">
              <label for="demoName">Your Name *</label>
              <input type="text" id="demoName" name="name" required>
            </div>
            
            <div class="form-group">
              <label for="demoCompany">Organization Name *</label>
              <input type="text" id="demoCompany" name="company" required>
            </div>
            
            <div class="form-group">
              <label for="demoVertical">Vertical *</label>
              <select id="demoVertical" name="vertical" required>
                <option value="">Select your vertical</option>
                <option value="schools">Schools & Education</option>
                <option value="senior_living">Senior Living</option>
                <option value="hotels">Hotels & Hospitality</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="demoEmail">Email *</label>
              <input type="email" id="demoEmail" name="email" required>
            </div>
            
            <div class="form-group">
              <label for="demoPhone">Phone</label>
              <input type="tel" id="demoPhone" name="phone">
            </div>
            
            <div class="form-group">
              <label for="demoMessage">Message (Optional)</label>
              <textarea id="demoMessage" name="message"></textarea>
            </div>
            
            <button type="submit" class="submit-button">Schedule Demo</button>
          </form>
        </div>
      \`;
      document.body.appendChild(modal);
    }
    
    function closeModal() {
      const modal = document.getElementById('demoModal');
      if (modal) modal.classList.remove('active');
    }
    
    async function submitDemoRequest() {
      const form = document.getElementById('demoForm');
      const formData = new FormData(form);
      
      try {
        const response = await fetch('/api/demo-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(formData))
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert('Demo request submitted! We'll contact you within 24 hours.');
          closeModal();
          form.reset();
        } else {
          alert('Error: ' + data.error);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit request. Please try again.');
      }
    }
    
    function showDemoContent(vertical) {
      const demoContent = DEMO_CONTENT[vertical] || [];
      const demoGrid = document.getElementById('demoGrid');
      const demoTitle = document.getElementById('demoTitle');
      
      const verticalNames = {
        schools: 'School Admin Dashboard',
        senior_living: 'Senior Living Dashboard',
        hotels: 'Hotel Admin Dashboard'
      };
      
      demoTitle.textContent = verticalNames[vertical] || vertical;
      demoGrid.innerHTML = demoContent.map(item => \`
        <div class="demo-item">
          <h4 style="color: var(--primary); margin-bottom: 0.5rem;">\${item.title}</h4>
          <p style="color: #666; font-size: 0.9rem;">\${item.description}</p>
        </div>
      \`).join('');
      
      document.getElementById('demoContent').style.display = 'block';
      
      // Scroll to demo content
      setTimeout(() => {
        document.getElementById('demoContent').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    
    // Initialize on load
    document.addEventListener('DOMContentLoaded', init);
  `;
}
require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const nodemailer = require('nodemailer');
const site = require('./site');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SITE_URL = (process.env.SITE_URL || '').replace(/\/+$/, '');
const isProd = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        styleSrc: ["'self'"],
        scriptSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
  })
);
app.use(compression());
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.json({ limit: '20kb' }));
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: isProd ? '30d' : 0,
    setHeaders: (res, filePath) => {
      if (filePath.includes(`${path.sep}fonts${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  })
);

app.locals.site = site;
app.locals.siteUrl = SITE_URL;
app.locals.year = new Date().getFullYear();

// Defaults available to every template
app.use((req, res, next) => {
  res.locals.path = req.path;
  res.locals.page = '';
  res.locals.description = site.description;
  res.locals.canonical = SITE_URL ? SITE_URL + (req.path === '/' ? '/' : req.path) : '';
  res.locals.form = { values: {}, status: '', message: '' };
  next();
});

// ---------- Pages ----------
function formStateFromQuery(req) {
  const service = site.enquiryTypes.some((t) => t.value === req.query.service) ? req.query.service : '';
  const status = req.query.sent === '1' ? 'ok' : req.query.sent === '0' ? 'err' : '';
  const message =
    status === 'ok'
      ? 'Thank you, your enquiry has been sent. We’ll be in touch shortly.'
      : status === 'err'
      ? `Sorry, we couldn’t send your enquiry. Please check the form, or email us at ${site.email}.`
      : '';
  return { values: { service }, status, message };
}

app.get('/', (req, res) => {
  res.render('home', {
    page: 'home',
    title: `${site.name} | Recruitment & HR Solutions`,
    form: formStateFromQuery(req),
  });
});

app.get('/services', (req, res) => {
  res.render('services', {
    page: 'services',
    title: `Services | ${site.name}`,
    description: 'Recruitment, HR outsourcing and business partner support, and staff training and development from The Bridge.',
  });
});

app.get('/about', (req, res) => {
  res.render('about', {
    page: 'about',
    title: `About | ${site.name}`,
    description: 'The Bridge is a recruitment, HR support and business partner firm built for organisations that need workforce solutions to work.',
  });
});

app.get('/contact', (req, res) => {
  res.render('contact', {
    page: 'contact',
    title: `Contact | ${site.name}`,
    description: 'Book a consultation with The Bridge. Tell us what you need and we’ll come back with a proposal.',
    form: formStateFromQuery(req),
  });
});

app.get('/privacy', (req, res) => {
  res.render('privacy', { page: 'privacy', title: `Privacy policy | ${site.name}` });
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\n${SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml\n` : ''}`);
});

app.get('/sitemap.xml', (req, res) => {
  const base = SITE_URL || `${req.protocol}://${req.get('host')}`;
  const urls = ['/', '/services', '/about', '/contact', '/privacy']
    .map((u) => `  <url><loc>${base}${u}</loc></url>`)
    .join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

// ---------- Enquiry form ----------
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

// Simple in-memory rate limit: 5 enquiries per IP per 15 minutes.
const RATE_WINDOW = 15 * 60 * 1000;
const RATE_MAX = 5;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_MAX;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hits) if (!times.some((t) => now - t < RATE_WINDOW)) hits.delete(ip);
}, RATE_WINDOW).unref();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const oneLine = (v, max) => String(v || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
const multiLine = (v, max) => String(v || '').replace(/\r\n/g, '\n').trim().slice(0, max);

function validate(body) {
  const data = {
    name: oneLine(body.name, 120),
    company: oneLine(body.company, 160),
    email: oneLine(body.email, 200),
    phone: oneLine(body.phone, 40),
    service: oneLine(body.service, 40),
    message: multiLine(body.message, 5000),
  };
  const errors = {};
  if (!data.name) errors.name = 'Please enter your full name.';
  if (!data.email) errors.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(data.email)) errors.email = 'Please enter a valid email address.';
  if (data.phone && !/^[0-9+()\-.\s]{6,40}$/.test(data.phone)) errors.phone = 'Please enter a valid phone number.';
  if (!site.enquiryTypes.some((t) => t.value === data.service)) errors.service = 'Please choose what you need help with.';
  if (!data.message) errors.message = 'Please tell us a little about what you need.';
  return { data, errors };
}

app.post('/contact', async (req, res) => {
  const wantsJson = (req.get('accept') || '').includes('application/json');
  const back = req.body.source === 'home' ? '/' : '/contact';
  const reply = (status, body) =>
    wantsJson ? res.status(status).json(body) : res.redirect(303, `${back}?sent=${body.ok ? '1' : '0'}#enquiry`);

  // Honeypot: people never fill in the hidden "website" field; bots usually do.
  if (req.body.website) return reply(200, { ok: true });

  const { data, errors } = validate(req.body);
  if (Object.keys(errors).length) {
    return reply(400, { ok: false, error: 'Please check the highlighted fields.', errors });
  }
  if (rateLimited(req.ip)) {
    return reply(429, { ok: false, error: 'You’ve sent several enquiries in a short time. Please try again later.' });
  }

  const serviceLabel = site.enquiryTypes.find((t) => t.value === data.service).label;
  const text = [
    'New enquiry from the website',
    '',
    `Name:     ${data.name}`,
    `Company:  ${data.company || 'Not provided'}`,
    `Email:    ${data.email}`,
    `Phone:    ${data.phone || 'Not provided'}`,
    `Interest: ${serviceLabel}`,
    '',
    'Message:',
    data.message,
  ].join('\n');

  try {
    if (transporter) {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: process.env.MAIL_TO || site.email,
        replyTo: { name: data.name, address: data.email },
        subject: `Website enquiry: ${serviceLabel}, from ${data.name}${data.company ? ` (${data.company})` : ''}`,
        text,
      });
    } else {
      console.log(`\n--- Enquiry received (SMTP not configured, not emailed) ---\n${text}\n----------------------------------------------------------\n`);
    }
    return reply(200, { ok: true });
  } catch (err) {
    console.error('Failed to send enquiry email:', err.message);
    return reply(500, { ok: false, error: `Sorry, we couldn’t send your enquiry. Please email us at ${site.email}.` });
  }
});

// ---------- Errors ----------
app.use((req, res) => {
  res.status(404).render('error', {
    title: `Page not found | ${site.name}`,
    code: '404',
    heading: 'We couldn’t find that page.',
    text: 'The page you’re looking for may have moved or no longer exists.',
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(err.status || 500).render('error', {
    title: `Something went wrong | ${site.name}`,
    code: String(err.status || 500),
    heading: 'Something went wrong.',
    text: 'Please try again in a moment.',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`The Bridge website running at http://localhost:${PORT}`);
    if (!transporter) console.log('SMTP_HOST is not set, so enquiries will be printed here instead of emailed.');
  });
}

module.exports = app;

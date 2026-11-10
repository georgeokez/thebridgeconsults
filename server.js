require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const nodemailer = require('nodemailer');
const site = require('./site');
const serviceDetails = require('./content/services');
const insights = require('./content/insights');

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
app.locals.insights = insights;
// WebP version of a photo (generated alongside each .jpg in public/images)
app.locals.webp = (src) => src.replace(/\.(jpe?g|png)$/i, '.webp');
// "2026-11-10" -> "10 November 2026"
app.locals.formatDate = (iso) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const BRAND = site.brandName; // used in page titles

// ---------- Structured data (schema.org) for search engines ----------
function baseUrl(req) {
  return SITE_URL || `${req.protocol}://${req.get('host')}`;
}

function organisationNode(base) {
  return {
    '@type': 'ProfessionalService',
    '@id': `${base}/#organization`,
    name: site.brandName,
    alternateName: [site.name, site.legalName],
    legalName: site.legalName,
    url: `${base}/`,
    logo: `${base}/images/logo.png`,
    image: `${base}/images/og-image.jpg`,
    description: site.description,
    slogan: site.tagline,
    email: site.email,
    telephone: site.phoneHref.replace('tel:', ''),
    address: { '@type': 'PostalAddress', addressCountry: site.seo.countryCode },
    areaServed: site.seo.areaServed,
    identifier: { '@type': 'PropertyValue', propertyID: 'CAC RC Number', value: site.registration.rcNumber },
    knowsAbout: site.seo.topics,
    sameAs: site.social.map((s) => s.url),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Recruitment and HR services',
      itemListElement: site.services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, url: `${base}/services/${s.key}` },
      })),
    },
  };
}

function buildSchema(req, res, { type = 'WebPage', breadcrumb, extra = [] } = {}) {
  const base = baseUrl(req);
  const url = base + (req.path === '/' ? '/' : req.path);
  const graph = [
    organisationNode(base),
    {
      '@type': 'WebSite',
      '@id': `${base}/#website`,
      url: `${base}/`,
      name: site.brandName,
      inLanguage: 'en-GB',
      publisher: { '@id': `${base}/#organization` },
    },
    {
      '@type': type,
      '@id': `${url}#webpage`,
      url,
      name: res.locals.title,
      description: res.locals.description,
      inLanguage: 'en-GB',
      isPartOf: { '@id': `${base}/#website` },
      about: { '@id': `${base}/#organization` },
      ...(breadcrumb ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    },
  ];
  if (breadcrumb) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: breadcrumb.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        ...(b.path ? { item: base + b.path } : {}),
      })),
    });
  }
  return graph.concat(extra.map((fn) => (typeof fn === 'function' ? fn(base, url) : fn)));
}

// Defaults available to every template
app.use((req, res, next) => {
  const base = baseUrl(req);
  res.locals.path = req.path;
  res.locals.page = '';
  res.locals.description = site.description;
  res.locals.canonical = SITE_URL ? SITE_URL + (req.path === '/' ? '/' : req.path) : '';
  res.locals.absoluteBase = base;
  res.locals.ogImage = `${base}/images/og-image.jpg`;
  res.locals.ogType = 'website';
  res.locals.noindex = false;
  res.locals.breadcrumb = null;
  res.locals.schema = null;
  res.locals.form = { values: {}, status: '', message: '' };
  next();
});

// Render a page with its title/description, then attach structured data
function renderPage(req, res, view, locals, schemaOpts) {
  Object.assign(res.locals, locals);
  res.locals.schema = buildSchema(req, res, schemaOpts);
  res.render(view);
}

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
  renderPage(req, res, 'home', {
    page: 'home',
    title: `Recruitment & HR Consultancy in Nigeria & Africa | ${BRAND}`,
    description:
      'Nigeria-based recruitment, HR outsourcing and staff training firm helping organisations across Africa and worldwide hire the right people and build strong teams.',
    form: formStateFromQuery(req),
  });
});

app.get('/services', (req, res) => {
  renderPage(
    req,
    res,
    'services',
    {
      page: 'services',
      title: `Recruitment, HR Outsourcing & Training Services | ${BRAND}`,
      description:
        'Recruitment, HR outsourcing, HR business partner support and staff training for organisations in Nigeria, across Africa and internationally, from The Bridge Consults.',
      breadcrumb: [{ name: 'Home', path: '/' }, { name: 'Services' }],
    },
    { type: 'CollectionPage', breadcrumb: [{ name: 'Home', path: '/' }, { name: 'Services' }] }
  );
});

app.get('/services/:key', (req, res, next) => {
  const service = site.services.find((s) => s.key === req.params.key);
  const detail = serviceDetails[req.params.key];
  if (!service || !detail) return next();
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }, { name: service.name }];
  renderPage(
    req,
    res,
    'service',
    {
      page: 'services',
      title: detail.seoTitle,
      description: detail.metaDescription,
      service,
      detail,
      related: site.services.filter((s) => s.key !== service.key),
      breadcrumb: crumbs,
    },
    {
      breadcrumb: crumbs,
      extra: [
        (base, url) => ({
          '@type': 'Service',
          '@id': `${url}#service`,
          name: service.name,
          serviceType: service.name,
          description: detail.metaDescription,
          url,
          provider: { '@id': `${base}/#organization` },
          areaServed: site.seo.areaServed,
        }),
        (base, url) => ({
          '@type': 'FAQPage',
          '@id': `${url}#faq`,
          mainEntity: detail.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }),
      ],
    }
  );
});

app.get('/about', (req, res) => {
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'About' }];
  renderPage(
    req,
    res,
    'about',
    {
      page: 'about',
      title: `About Us | ${BRAND}, Recruitment & HR Partner in Africa`,
      description:
        'Meet The Bridge Consults, a Nigeria-based recruitment, HR support and business partner firm working with organisations across Africa and internationally.',
    },
    {
      type: 'AboutPage',
      breadcrumb: crumbs,
      extra: site.team
        .filter((m) => m.name)
        .map((m) => (base) => ({
          '@type': 'Person',
          name: m.name,
          jobTitle: m.role,
          image: base + m.photo.src,
          worksFor: { '@id': `${base}/#organization` },
        })),
    }
  );
});

app.get('/insights', (req, res) => {
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Insights' }];
  renderPage(
    req,
    res,
    'insights',
    {
      page: 'insights',
      title: `HR & Hiring Insights | ${BRAND}`,
      description:
        'Practical guidance on recruitment, onboarding and HR for organisations in Nigeria, across Africa and around the world, from The Bridge Consults.',
      breadcrumb: crumbs,
    },
    { type: 'CollectionPage', breadcrumb: crumbs }
  );
});

app.get('/insights/:slug', (req, res, next) => {
  const article = insights.find((a) => a.slug === req.params.slug);
  if (!article) return next();
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Insights', path: '/insights' }, { name: article.title }];
  renderPage(
    req,
    res,
    'article',
    {
      page: 'insights',
      title: `${article.title} | ${BRAND}`,
      description: article.description,
      ogType: 'article',
      article,
      relatedService: site.services.find((s) => s.key === article.service),
      breadcrumb: crumbs,
    },
    {
      breadcrumb: crumbs,
      extra: [
        (base, url) => ({
          '@type': 'Article',
          '@id': `${url}#article`,
          headline: article.title,
          description: article.description,
          datePublished: article.date,
          dateModified: article.updated || article.date,
          inLanguage: 'en-GB',
          image: `${base}/images/og-image.jpg`,
          mainEntityOfPage: { '@id': `${url}#webpage` },
          author: { '@id': `${base}/#organization` },
          publisher: { '@id': `${base}/#organization` },
        }),
      ],
    }
  );
});

app.get('/contact', (req, res) => {
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Contact' }];
  renderPage(
    req,
    res,
    'contact',
    {
      page: 'contact',
      title: `Contact Us | ${BRAND}`,
      description:
        'Book a consultation with The Bridge Consults, a recruitment and HR firm based in Nigeria and working across Africa and internationally. Tell us what you need.',
      form: formStateFromQuery(req),
    },
    { type: 'ContactPage', breadcrumb: crumbs }
  );
});

app.get('/privacy', (req, res) => {
  renderPage(req, res, 'privacy', {
    page: 'privacy',
    title: `Privacy Policy | ${BRAND}`,
    description: 'How The Bridge Consults handles the information you share with us through this website.',
  });
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\n${SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml\n` : ''}`);
});

app.get('/sitemap.xml', (req, res) => {
  const base = baseUrl(req);
  const pages = [
    { path: '/', lastmod: site.updated },
    { path: '/services', lastmod: site.updated },
    ...site.services.map((s) => ({ path: `/services/${s.key}`, lastmod: site.updated })),
    { path: '/about', lastmod: site.updated },
    { path: '/insights', lastmod: insights.length ? insights[0].date : site.updated },
    ...insights.map((a) => ({ path: `/insights/${a.slug}`, lastmod: a.updated || a.date })),
    { path: '/contact', lastmod: site.updated },
    { path: '/privacy', lastmod: site.updated },
  ];
  const urls = pages
    .map((p) => `  <url><loc>${base}${p.path}</loc><lastmod>${p.lastmod}</lastmod></url>`)
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
  res.locals.noindex = true;
  res.status(404).render('error', {
    title: `Page not found | ${BRAND}`,
    code: '404',
    heading: 'We couldn’t find that page.',
    text: 'The page you’re looking for may have moved or no longer exists.',
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return;
  res.locals.noindex = true;
  res.status(err.status || 500).render('error', {
    title: `Something went wrong | ${BRAND}`,
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

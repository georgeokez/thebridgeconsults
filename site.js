// Site content and contact details.
// Edit the text here; the page templates in /views read from this file.

module.exports = {
  name: 'The Bridge',
  brandName: 'The Bridge Consults',
  legalName: 'TheBridge Professional Services Limited',
  tagline: 'Connecting Talent. Building Businesses.',
  description:
    'The Bridge is a recruitment, HR outsourcing and business partner firm for organisations that need workforce solutions to work, not just look good on paper.',

  email: 'thebridgerecruiter@gmail.com',
  phone: '0802 543 5028',
  phoneHref: 'tel:+2348025435028',

  // Company registration (from the CAC Certificate of Incorporation)
  registration: {
    rcNumber: '9475205',
    authority: 'Corporate Affairs Commission (CAC), Nigeria',
    act: 'Companies and Allied Matters Act 2020',
  },

  // Team members shown in "Meet the team" on the About page.
  // A member is shown once `name` or `role` is filled in; `name` and `bio` are optional.
  team: [
    {
      name: '',
      role: 'Digital Marketer',
      bio: '',
      photo: { src: '/images/team-1.jpg', w: 800, h: 800 },
    },
  ],

  social: [
    { label: 'Instagram', url: 'https://www.instagram.com/thebridgeconsults_' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/company/136015830' },
    { label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61593121294521' },
  ],

  // Organisations shown in the "supported" strip. Add more as clients agree to be listed.
  clients: ['Benson Coleman Associates', 'Ception Health Limited'],

  challenges: [
    { title: 'Difficulty sourcing the right talent', body: 'Roles filled with compromise candidates who don’t last.' },
    { title: 'Hiring timelines that stretch too long', body: 'Operational gaps that cost money and slow delivery.' },
    { title: 'High employee turnover', body: 'Constant re-hiring that drains management attention.' },
    { title: 'No structured onboarding', body: 'New hires underperform and disengage early.' },
    { title: 'HR handled by non-HR staff', body: 'Compliance gaps and a resource drain on core teams.' },
    { title: 'No defined workforce structure', body: 'Unclear accountability, role overlap and poor performance.' },
  ],

  // Service keys are used in URLs (/services#recruitment) and the contact form (?service=recruitment).
  services: [
    {
      key: 'recruitment',
      name: 'Recruitment Services',
      summary: 'The right people, in the right roles, faster. We manage the full hiring cycle for local and expatriate roles, end to end.',
      headline: 'The right people. In the right roles. Faster.',
      intro: 'We manage the full hiring cycle, from understanding the role to placing the right candidate, for local and expatriate roles alike.',
      points: [
        'Role scoping and consultation',
        'Targeted sourcing across professional channels and talent networks',
        'Structured screening, shortlisting and evaluation',
        'Interview scheduling and process coordination',
        'Placement support with post-hire follow-up',
      ],
      image: { src: '/images/talent.jpg', alt: 'Hand on a laptop surrounded by candidate profile icons', w: 574, h: 395 },
    },
    {
      key: 'hr-outsourcing',
      name: 'HR Outsourcing & Business Partner',
      summary: 'All the workforce infrastructure, none of the overhead: onboarding, documentation, policy and compliance.',
      headline: 'All the workforce infrastructure. None of the overhead.',
      intro: 'When business priorities compete for time, HR slips and gaps open in workforce management and compliance. We close them.',
      points: [
        'Employee onboarding coordination',
        'Workforce administration and documentation',
        'HR process design and support',
        'Compliance and policy coordination',
        'Ongoing employee management assistance',
      ],
      image: { src: '/images/office.jpg', alt: 'Sunlit office desk', w: 640, h: 430 },
    },
    {
      key: 'training',
      name: 'Staff Training & Development',
      summary: 'Build a workforce that keeps improving, with practical training built for the realities of your workplace.',
      headline: 'Build a workforce that keeps improving.',
      intro: 'Hiring well is only the beginning. We support performance and development through practical training built for your workplace.',
      points: [
        'Structured onboarding guidance for new hires',
        'Workplace communication and professionalism training',
        'Productivity and operational effectiveness programmes',
        'Targeted employee development initiatives',
      ],
      image: { src: '/images/meeting-room.jpg', alt: 'Meeting room ready for a training session', w: 864, h: 280 },
    },
  ],

  partnerExtras: [
    'Strategic HR Advisory',
    'Talent Management',
    'Workforce Planning',
    'Performance Management Systems',
    'Employee Relations',
    'Organizational Development',
    'HR Policy Design Support',
    'Change Management',
  ],

  process: [
    { title: 'Consultation & needs assessment', body: 'We listen, assess the gaps and recommend.' },
    { title: 'Talent acquisition strategy', body: 'A sourcing plan specific to the role and industry.' },
    { title: 'Structured screening', body: 'You only meet properly vetted candidates.' },
    { title: 'Interview coordination', body: 'We manage interviews and selection for you.' },
    { title: 'Placement & post-hire support', body: 'We stay close through the first weeks.' },
  ],

  reasons: [
    { title: 'Business-first thinking', short: 'Every recommendation is grounded in your operational goals.', long: 'Hiring is a business decision. Every recommendation is grounded in your operational goals.' },
    { title: 'Quality over volume', short: 'Not 30 CVs. Just the right candidates, vetted, with clear reasoning.', long: 'We don’t send 30 CVs and hope. We send the right candidates, vetted, with clear reasoning.' },
    { title: 'End-to-end accountability', short: 'From first brief to post-placement follow-up, we own the process.', long: 'From first brief to post-placement follow-up, we own the process.' },
    { title: 'Industry breadth', short: 'The network and context to source effectively across sectors.', long: 'Professional services, technology, finance, healthcare, FMCG and more, with the network and context to source effectively across sectors.' },
    { title: 'Scalable HR support', short: 'From one critical role to a whole onboarding system, we scale with you.', long: 'Whether it’s one critical role or an entire onboarding system, our support scales with you.' },
    { title: 'Long-term relationships', short: 'Partnerships, not transactions. Clients return because it works.', long: 'Partnerships, not transactions. Our clients come back because it works.' },
  ],

  industries: [
    'Professional Services',
    'Healthcare & Diagnostics',
    'Technology',
    'Finance',
    'Oil & Gas',
    'Hospitality',
    'Logistics',
    'FMCG & Retail',
    'Corporate Organisations',
    'Startups & SMEs',
  ],

  // Options for "What do you need help with?" on the enquiry form.
  enquiryTypes: [
    { value: 'recruitment', label: 'Recruitment' },
    { value: 'hr-outsourcing', label: 'HR outsourcing / business partner' },
    { value: 'training', label: 'Staff training & development' },
    { value: 'not-sure', label: 'Not sure yet' },
  ],
};

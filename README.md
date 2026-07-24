# Web Design Trend Catalog

Production-ready static website for **Web Design Trend Catalog**, built under the creative direction **The Web, Indexed**.

## Launch contents

- 64 trend entries generated from one central JavaScript data file
- 11 style-family pages
- 4 era pages
- Searchable and filterable catalog
- Interactive timeline
- Side-by-side comparison tool
- Glossary and saved study list
- 5 Field Notes generated from one central JavaScript data file
- Unique metadata, Open Graph tags, Twitter cards, JSON-LD, breadcrumb markup, sitemap, RSS, robots.txt, and 404 page
- Keyboard navigation, visible focus, reduced-motion support, dark theme, print styles, and accessible forms
- Real server-side-ready SMTP contact endpoint with validation, rate limiting, honeypot, timing check, loading state, success feedback, and error handling

## Project structure

```text
/
├── index.html
├── catalog.html
├── timeline.html
├── compare.html
├── glossary.html
├── learn.html
├── about.html
├── methodology.html
├── sources.html
├── contribute.html
├── contact.html
├── accessibility.html
├── privacy.html
├── saved.html
├── changelog.html
├── 404.html
├── contact-handler.php
├── QA-REPORT.md
├── sitemap.xml
├── feed.xml
├── robots.txt
├── .htaccess
├── eras/
├── styles/
├── trends/                 # 64 generated static trend pages
├── field-notes/            # overview plus generated article pages
├── private/
│   ├── config.example.php
│   └── .htaccess
└── assets/
    ├── css/
    ├── js/
    │   └── data/
    │       ├── trends-data.js
    │       └── posts-data.js
    ├── images/
    │   ├── trends/         # original SVG representative reconstructions
    │   ├── references/     # user-supplied reference images
    │   └── og/             # social-sharing images
    ├── icons/
    └── documents/
```

## Publish on Hostinger

1. Extract the ZIP locally.
2. In Hostinger File Manager, open the domain's `public_html` directory.
3. Upload **the contents of this project folder**, not the outer folder itself.
4. Confirm that `index.html`, `.htaccess`, and `contact-handler.php` are directly inside `public_html`.
5. Replace the placeholder canonical domain if the final domain is not `webdesigntrendcatalog.com`. Search the project for `https://webdesigntrendcatalog.com` and replace it consistently in HTML, `sitemap.xml`, and `robots.txt`.
6. In hPanel, confirm the site is using PHP **8.2 or newer**. The contact endpoint is compatible with currently supported PHP 8.x versions.
7. Create or choose the Hostinger mailbox that will send and receive form messages.
8. Copy `private/config.example.php` to a private folder **outside** `public_html`:

   ```text
   .../YOUR-DOMAIN/
   ├── public_html/
   └── wdtc-private/
       └── config.php
   ```

   In other words, create `wdtc-private/config.php` in the directory that contains `public_html`. Hostinger account paths vary by hosting layout. When File Manager does not permit that location, place the completed file at `public_html/private/config.php`; the included `.htaccess` blocks web access to that fallback directory.
9. Edit the private configuration:
   - `smtp_host`: `smtp.hostinger.com`
   - `smtp_port`: `465`
   - `smtp_encryption`: `ssl`
   - `smtp_username`: the full Hostinger email address
   - `smtp_password`: the mailbox password
   - `from_email`: normally the same mailbox as the username
   - `to_email`: the inbox that should receive submissions
   - `allowed_origins`: the final HTTPS domain, with and without `www` only when both are active
   - `csrf_secret`: replace with a unique random value of at least 32 characters
   - `rate_limit_salt`: replace with a different long random value
10. Visit `contact.html`, submit a real test, verify delivery, verify Reply-To, and inspect the spam folder during the first test.
11. Enable HTTPS for the domain and make the HTTPS version canonical before launch.

No Node.js, npm, package manager, or deployment build step is required.

## Local preview

A local web server is preferable because browsers restrict some behavior under `file://` URLs:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. The SMTP endpoint requires a PHP-capable server and private configuration; the rest of the site works as static files.

## Content maintenance

### Trend catalog

All trend records are stored in:

```text
assets/js/data/trends-data.js
```

Each record contains the required title, slug, client, category, descriptions, services, technologies, completion date, featured image, gallery images, optional website URL, periods, common names, typical elements, families, related entries, image credits, and SEO metadata.

The production pages are static snapshots generated from that data architecture. When adding or revising an entry, update the one trend record and regenerate only the affected overview/index output, individual trend page, search data, and sitemap. Shared layout, CSS, JavaScript, and unrelated pages should not be rewritten.

### Field Notes

All posts are stored in:

```text
assets/js/data/posts-data.js
```

A post contains title, slug, author, publish date, excerpt, featured image, categories, tags, SEO title, meta description, full article, sections, and related trend slugs. The same maintenance principle applies: update the post record and regenerate its article page, overview listing, RSS item, and sitemap entry without changing unrelated design code.

## Image policy before public launch

- All SVG trend specimens are original representative reconstructions.
- The two optimized WebP files in `assets/images/references/` were supplied for the project and are labeled for rights review.
- Confirm permission, source, creator, approximate date, and credit for those reference images or replace them before public commercial publication.
- Do not present a reconstruction as archival evidence.

## Contact-form troubleshooting

- A `503` response means no readable private configuration was found.
- A `502` response means SMTP connection or delivery failed; review the PHP error log and mailbox credentials.
- A `403` response usually means the submitted domain is absent from `allowed_origins`.
- A `419` response means the signed form token was invalid or expired; reload the form page.
- A `429` response means the minimum-delay or rate-limit protection was triggered.
- Hostinger may require the sending address to match the authenticated mailbox.
- Keep credentials outside JavaScript, HTML, and public version control.

## Prelaunch checklist

- Replace the canonical domain if necessary.
- Confirm both user-supplied image rights.
- Add the operator's legal name, privacy contact, jurisdiction-specific language, and retention schedule to `privacy.html`.
- Test contact and contribution delivery from the production domain.
- Validate structured data, sitemap access, keyboard navigation, contrast, reduced motion, and mobile layouts.
- Replace placeholder mailbox values in the private configuration only—not in public files.

## Modified vibe code prompt

```
You are no longer just an AI assistant.

You are now my award-winning web design agency, consisting of experts in:

• Branding
• UX/UI Design
• Conversion Optimization
• SEO
• Accessibility
• Copywriting
• Front-End Development
• User Experience
• Performance Optimization

Your mission is to create a premium website that looks and feels like it was designed by one of the world's best digital agencies.

The website should feel modern, unique, polished, trustworthy, premium, memorable and conversion-focused.

It should NOT look like a generic AI-generated website.

Your goal is not simply to generate code.

Your goal is to create a website that helps my business grow.

──────────────────────────────
STEP 1 — DISCOVERY
──────────────────────────────

Before creating anything, interview me exactly like a professional web design agency would.

Ask me exactly FIVE questions.

Ask ONE question at a time.

Your questions should uncover:

• What my business does
• Who my ideal customer is
• The primary goal of the website
• The emotions visitors should experience
• Websites or brands that inspire me

Do not ask technical questions unless absolutely necessary.

Wait until all five questions have been answered.

──────────────────────────────
STEP 2 — CREATIVE DIRECTION
──────────────────────────────

After I answer the five questions:

Create a professional Creative Brief.

Include:

• Brand Positioning
• Target Audience
• Business Goals
• Conversion Goals
• Tone of Voice
• Visual Direction
• User Experience Strategy

Recommend:

• Color Palette
• Typography
• Layout Style
• Button Style
• Animation Style
• Icon Style
• Photography Style

Explain WHY each recommendation fits my business.

Then ask for my approval before continuing.

Do NOT build the website yet.

──────────────────────────────
STEP 3 — WEBSITE PLANNING
──────────────────────────────

After I approve the Creative Brief:

Create a complete sitemap.

Explain the purpose of every page.

Recommend additional pages that could improve conversions or SEO.

Then ask for approval again before building anything.

──────────────────────────────
STEP 4 — BUILD THE WEBSITE
──────────────────────────────

After I approve the sitemap:

Build a complete production-ready website.

Use ONLY:

• HTML5
• CSS3
• Modern JavaScript (ES6)

Do NOT use:

• React
• Next.js
• Vue
• Angular
• Bootstrap
• Tailwind
• jQuery
• Any JavaScript framework
• Any CSS framework

The website should be uploadable directly to standard web hosting such as <USE YOUR DESIRED HOSTING PLATFORM HERE> without requiring:

• Node.js
• npm
• a build process
• package managers
• additional installations

Organize the project professionally.

Example structure:

/
index.html
about.html
services.html
portfolio.html
blog.html
contact.html

/assets
/css
/js
/images
/icons
/fonts

Keep the code clean.

Separate HTML, CSS and JavaScript.

Write reusable JavaScript whenever appropriate.

Avoid duplicate code.

The design should feel luxurious, premium and professionally crafted.

Focus heavily on:

• whitespace
• typography
• hierarchy
• storytelling
• animations
• responsiveness
• accessibility
• SEO
• performance

Create smooth scrolling.

Create beautiful hover effects.

Create subtle animations.

Create a website people remember.

Avoid generic templates.

Create something unique.

──────────────────────────────
PORTFOLIO
──────────────────────────────

The portfolio must be easy to update.

Do NOT hardcode portfolio items throughout multiple pages.

Instead:

Store every portfolio project inside ONE JavaScript data file.

Each project should contain:

• title
• slug
• client
• category
• short description
• full description
• services
• technologies
• completion date
• featured image
• gallery images
• website URL (optional)

Automatically generate:

• the portfolio overview
• individual portfolio pages

When I later ask:

"Add a new portfolio project"

only update the portfolio data while preserving:

• layout
• styling
• animations
• responsiveness
• SEO

Do not rebuild unrelated parts of the website.

──────────────────────────────
BLOG
──────────────────────────────

Create the blog using the same approach.

Store every blog post inside ONE JavaScript data file.

Each post should contain:

• title
• slug
• author
• publish date
• excerpt
• featured image
• categories
• tags
• SEO title
• meta description
• full article

Automatically generate:

• the blog overview
• individual blog pages

If I later ask:

"Create a new blog post"

only update the blog data.

Preserve everything else.

──────────────────────────────
CONTACT FORM
──────────────────────────────

Create a fully functional contact form.

Do NOT create a fake placeholder.

Implement:

• frontend validation
• server-side ready form submission
• loading state
• success message
• error handling
• spam protection

The contact form must be ready to connect to SMTP after deployment.

Never hardcode credentials.

Instead, clearly explain which SMTP settings I need to configure after deploying the website.

Suggest contact form processing options I can use with <USE YOUR HOSTING PLATFORM HERE>.

──────────────────────────────
SEO
──────────────────────────────

Every page should include:

• unique title
• meta description
• semantic HTML
• proper heading hierarchy
• Open Graph tags
• Twitter cards
• schema markup where appropriate

Optimize everything for search engines.

──────────────────────────────
PERFORMANCE
──────────────────────────────

Optimize for:

• Google PageSpeed
• Core Web Vitals
• accessibility
• lazy loading
• responsive images
• clean CSS
• efficient JavaScript

──────────────────────────────
QUALITY
──────────────────────────────

Think like:

• Creative Director
• Brand Strategist
• UX Designer
• Senior Web Designer
• Front-End Developer
• SEO Specialist
• Conversion Expert

Challenge weak ideas.

Recommend better solutions.

Explain your reasoning.

Never settle for average.

──────────────────────────────
FINAL STEP
──────────────────────────────

Before presenting the website:

Review the entire project.

Check for mistakes.

Fix inconsistencies.

Ensure every page is connected correctly.

Ensure navigation works.

Ensure all links work.

Ensure the website is responsive.

Ensure the design feels premium.

Then present the finished website together with a clear explanation of the project structure and simple instructions for publishing it on <USE YOUR DESIRED HOSTING PLATFORM HERE>.

Do not stop until the website is production-ready.

The name of my company is: <USE YOUR DESIRED WEBSITE NAME HERE>
```

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

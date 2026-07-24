# Hostinger Deployment Checklist

1. Upload the project contents to `public_html`.
2. Confirm `index.html` is at the root.
3. Set the final domain in canonical tags, sitemap, and robots file.
4. Confirm PHP 8.2 or newer is selected in hPanel.
5. Create `wdtc-private/config.php` outside `public_html` from `private/config.example.php`.
6. Enter the Hostinger SMTP mailbox credentials; use that authenticated mailbox as `from_email` and a separate receiving inbox or alias as `to_email`.
7. Replace `csrf_secret` and `rate_limit_salt` with two different long random values.
8. Add the production HTTPS origin to `allowed_origins`.
9. Test contact and contribution forms and confirm that Reply-To points to the visitor’s address.
10. Confirm user-supplied image rights or replace the images.
11. Complete the privacy notice with legal operator details.
12. Test desktop, tablet, mobile, keyboard, reduced motion, and print output.

GitHub Pages can host the static pages but cannot run the PHP contact endpoint.

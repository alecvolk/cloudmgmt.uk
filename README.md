# cloud management static site

Static website for `cloudmgmt.uk`, designed to deploy with GitHub Pages.

## Files

- `index.html` - home page
- `application.html` - 2026 applications closed page
- `styles.css` - shared styling
- `script.js` - mobile navigation
- `CNAME` - GitHub Pages custom domain configuration for `cloudmgmt.uk`
- `.nojekyll` - tells GitHub Pages to serve files as plain static assets

## GitHub Pages setup

Use GitHub Pages with:

- Source: deploy from a branch
- Branch: `main`
- Folder: `/root`
- Custom domain: `cloudmgmt.uk`
- Enforce HTTPS: enabled once GitHub allows it

## Cloudflare DNS setup

For the apex domain `cloudmgmt.uk`, create these GitHub Pages records:

- `A` record, name `@`, value `185.199.108.153`
- `A` record, name `@`, value `185.199.109.153`
- `A` record, name `@`, value `185.199.110.153`
- `A` record, name `@`, value `185.199.111.153`

For `www.cloudmgmt.uk`, create:

- `CNAME` record, name `www`, value `<github-username>.github.io`

These values come from GitHub's current Pages custom-domain documentation.

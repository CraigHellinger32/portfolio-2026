This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Image Delivery

Case-study card photos use Next Image resizing and WebP output. Set
`NEXT_PUBLIC_WORDPRESS_URL` to the production WordPress URL before building;
the image allowlist is restricted to that host's `/wp-content/uploads/` path.
The Next server must be able to fetch those URLs. SVG logos are served directly.
Upload card photos at least 460px square for a 230px card on a 2x display;
the current 230px originals cannot gain detail through optimization.

Post content and ACF sidebar HTML retain WordPress `srcset`, native lazy loading,
and layout-aware `sizes`. The content plugin registers uncropped 400px, 480px,
and 880px variants. EWWW Image Optimizer supplies WebP `<picture>` sources with
JPEG fallback through its `eio_parse_page_html` integration, so no Apache rewrite
rules or client-side WebP rewriting are needed for the headless frontend.

When migrating, copy the media files (including `.webp` siblings), database, and
EWWW Image Optimizer plugin. For a fresh WordPress installation:

```sh
wp plugin install ewww-image-optimizer --activate
```

In EWWW settings, enable WebP conversion and Picture WebP rewriting, set WebP
quality to 75, and leave Easy IO/CDN and additional lazy loading disabled.
Keep JPG/PNG/GIF/SVG optimization disabled if originals must remain untouched;
do not enable original deletion or format replacement. Local WebP encoding must
be supported by the production host; no cloud API key is configured here.

After activating the content plugin and saving EWWW settings, generate missing
sizes and WebP copies for existing uploads:

```sh
wp media regenerate --only-missing --skip-delete --yes
wp ewwwio optimize media --webp-only --noprompt
```

Regeneration can refresh existing thumbnails; full-resolution originals remain
available. Take a media/database backup before production bulk operations.
New uploads are processed automatically. Refresh or revalidate cached frontend
pages after changing image variants or delivery settings.

For browser verification, test mobile and desktop at both 1x and 2x pixel density.
Open a case study, scroll its images into view, and inspect Network requests and
each image's `currentSrc`, rendered width, and natural width. Check WebP delivery,
appropriate candidate sizes, preserved image proportions, and 30px/40px spacing.
Use a fresh browser context per density to avoid reuse of larger cached candidates.

## CV Download

A standalone HTML CV is available at `/cv.html` from `public/cv.html`. Its
typography is defined separately in `public/cv.css`. Update its portfolio URL
and bracketed content prompts before sharing it. This page is separate from
the PDF linked by the CV card.

The CV card uses WPGraphQL's `cvUrl` field, registered by the content plugin.
WordPress stores the PDF attachment ID in `pf2026_cv_attachment_id` and resolves
its URL with `wp_get_attachment_url()`. No local or production hostname is stored
in the frontend source.

Migrate the WordPress database and uploads together, including the PDF, and update
WordPress's site/upload URLs and `NEXT_PUBLIC_WORDPRESS_URL` for the target
environment. Rebuild or revalidate frontend pages after migration or replacing
the PDF so statically generated links pick up the new URL.

To replace the CV, upload a new PDF in the Media Library, then select its ID:

```sh
wp option update pf2026_cv_attachment_id <new-pdf-attachment-id>
```

The card is non-navigating if no valid PDF is configured. The configured PDF URL
is public; do not use this setting for a private document.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

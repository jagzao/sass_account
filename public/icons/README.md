# PWA Icons

This directory contains the PWA icons for the application.

## Required Icons

The following icon sizes are needed for PWA support:

- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## Generating Icons

You can generate all required icons from a single source image using online tools like:

- https://realfavicongenerator.net/
- https://www.pwabuilder.com/
- https://favicon.io/

Or use a tool like `pwa-asset-generator`:

```bash
npx pwa-asset-generator logo.png public/icons --icon-only --padding "10%"
```

## Current Status

Icons need to be generated and placed in this directory. The app will work without them, but install prompts may not show proper branding.

# AGENTS.md

# Repository instructions

- Never commit code or create a commit unless Craig explicitly gives permission. Do not push or deploy without explicit permission either.
- Use Local WordPress for development. Do not change production WordPress content, database, settings, or media unless Craig explicitly authorizes that specific operation.
- Treat credentials and production secrets as private: do not print them, add them to source control, or expose them through `NEXT_PUBLIC_` variables. Keep local secrets in ignored environment files and production secrets in the hosting provider's secret settings.
- Do not run Playwright or browser automation unless Craig explicitly asks. For visual changes, suggest a manual visual check when appropriate.
- Make focused changes, preserve unrelated work, run the smallest relevant tests or checks, and report anything you could not verify.

## Skills

- For creating, updating, or syncing portfolio case studies from Figma to WordPress, read and follow [`.github/skills/figma-wordpress-case-study/SKILL.md`](.github/skills/figma-wordpress-case-study/SKILL.md) before starting. It covers Figma inspection, safe WordPress content and media updates, ACF fields, and frontend verification.

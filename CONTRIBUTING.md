# Contributing to RailMadad

Thanks for wanting to contribute! This guide helps you set up a local developer environment and submit focused changes.

Getting started

- Fork the repository and create a feature branch: `git checkout -b feat/your-change`
- Install dependencies (root scripts available):

```bash
# from repository root
npm run install-all
```

Backend dev

- Copy environment example: `backend/.env.example` → `backend/.env` and set values.
- Start the backend:

```bash
cd backend
npm run dev
```

Frontend dev

```bash
cd frontend
npm run dev
```

Tests

- Backend tests are under `backend/tests`.

```bash
cd backend
npm test
```

Code style

- ESLint & Prettier are configured for the backend. Run `npm run lint` and `npm run format` in `backend` to keep changes clean.

Pull requests

- Keep PRs small and focused.
- Add tests for bug fixes and new behavior when possible.
- Provide a short description and steps to reproduce the issue (if applicable).

Where to contribute

- Bug fixes, clearer docs, unit tests, accessibility/usability improvements in the frontend, and small automation scripts are all welcome.

Contact

- If you need help getting set up, open an issue describing the problem and include relevant logs.

Thank you — your contributions make RailMadad better!

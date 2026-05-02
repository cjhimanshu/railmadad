# Changelog

## Unreleased

- Improve backend startup: fail fast with clear error when `MONGODB_URI`/`MONGO_URI` is missing.
- Harden `authorize` middleware to return 401 when `req.user` is absent and 403 for unauthorized roles.
- Harden `optionalProtect` middleware to safely handle invalid tokens without throwing and ensure `req.user` is null for guests.
- Add tests covering DB config, `authorize`, and `optionalProtect` middleware.

# Architecture

- Server: Node.js + Express (server.js)
- DB: MongoDB via Mongoose (optional in demo mode)
- Auth: Passport (Google OAuth)
- Storage: Multer for uploads
- Frontend: Static HTML pages served by Express

## Modules
- models/: Mongoose models
- routes: Inlined in server.js
- OAuth: Passport strategy configuration

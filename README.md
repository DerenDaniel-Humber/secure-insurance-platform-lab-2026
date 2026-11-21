# NorthStar Insurance Platform

A learning prototype for secure insurance operations: HTTPS, short-lived JWT authentication, role-based access, customer ownership checks, user profile management, policies, underwriting requests and claims decisioning.

> **Academic work:** This is a starter implementation for the individual lab. Review, run, understand, personalize and document it yourself before submitting. The included self-signed certificates and demo credentials are for local development only.

## Stack and layout

- `backend/`: Node.js, Express, HTTPS, `jsonwebtoken`, `bcryptjs`, dotenv, JSON-file persistence.
- `frontend/`: React 19 and Next.js 15 portal with customer, staff and administrator views.
- `scripts/`: local development certificate generation.
- `docs/`: lab report and required scenario checklist.

## Requirements

Node.js 20+, npm, and OpenSSL.

## Run locally

1. Copy `backend/.env.example` to `backend/.env`; set `JWT_SECRET` to a new random value of at least 32 characters.
2. Generate a self-signed localhost certificate: `cd backend && npm run certs`.
3. Install and start the API: `cd backend && npm install && npm run dev`.
4. In another terminal, copy `frontend/.env.local.example` to `frontend/.env.local`.
5. Start the web app: `cd frontend && npm install && npm run dev`.
6. Open `https://localhost:3000`. Accept the browser warning for your locally generated self-signed certificate. The API health route is `https://localhost:4000/api/health`.

Both local web and API servers use the generated self-signed localhost certificate. Visit `https://localhost:4000/api/health` first and accept the browser's local certificate warning, then open `https://localhost:3000` and accept its warning if prompted. This exception is for local development only. In deployment, use a proper CA-issued certificate and reverse proxy.

## Demo accounts

All accounts use locally seeded sample data and reset only if `backend/data/db.json` is removed. Initial passwords:

| Role | Username | Password |
|---|---|---|
| Customer | `customer` | `Customer123!` |
| Second customer (ownership checks) | `customer2` | `Customer123!` |
| Insurance agent | `agent` | `Agent123!` |
| Underwriter | `underwriter` | `Underwriter123!` |
| Claims adjuster | `adjuster` | `Adjuster123!` |
| Customer service | `service` | `Service123!` |
| Compliance officer | `compliance` | `Compliance123!` |
| Administrator | `admin` | `Admin123!` |

These credentials are public demo data and must never be reused outside local development.

## Security design

- Passwords are hashed with bcrypt and omitted from API responses.
- Login issues a signed JWT with subject, username, roles, issuer, audience and expiry. API middleware verifies signature and expiry and reloads current account status and roles from storage for every protected request. Disabling an account takes effect immediately.
- The frontend stores the demo token in `sessionStorage`, clears it on sign-out, and sends it as a Bearer token. For a production design, prefer secure, HttpOnly, SameSite cookies with CSRF protections.
- Middleware separates authentication (`auth`) from role authorization (`allow`). Customer policy access checks ownership; claim and request access filters by customer/request ownership.
- Only administrators can manage users and role assignments. Role changes are persisted and take effect on the next API request.
- Sensitive responses use `Cache-Control: no-store`. HTTPS is used for the API and Next development server.
- JSON persistence is atomic for this prototype but does not replace a transactional database. The app is not production-hardened.

## API overview

| Area | Routes |
|---|---|
| Auth/profile | `POST /api/auth/login`, `GET /api/auth/me`, `GET/PATCH /api/profile` |
| Admin | `GET /api/admin/users`, `POST /api/admin/users`, `GET/PATCH /api/admin/users/:id`, `PATCH /api/admin/users/:id/status`, role assignment/removal routes, `GET /api/admin/roles`, `GET /api/admin/audit` |
| Policies | `GET /api/policies`, `GET /api/policies/:id`, `POST /api/policies` |
| Amendments | `GET/POST /api/amendments`, `PATCH /api/amendments/:id/decision` |
| Reductions | `GET/POST /api/reductions`, `PATCH /api/reductions/:id/decision` |
| Claims | `GET/POST /api/claims`, `PATCH /api/claims/:id/decision` |

## Authentication and authorization flow

1. Browser posts username/password to `/api/auth/login` over HTTPS.
2. Server verifies the bcrypt hash and active account status, then issues a signed, expiring JWT.
3. Browser holds the token for the current tab session and sends it in `Authorization: Bearer …`.
4. Middleware validates the token and reloads the user's current record; a disabled account is denied even with a previously issued token.
5. Role middleware checks the operation. Ownership checks scope customers to their own records.
6. Administrative changes append audit events; response objects never include password hashes.

## Testing

Run `cd backend && npm test` for the automated authorization and workflow suite (generate certificates first to run the HTTPS integration case). Scenario results and the frontend screenshot checklist are in `docs/test-results.md`. The implementation report is in `docs/lab-report.docx` and `docs/lab-report.pdf`; personalize the report and add your own screenshots before submitting.

## GitHub submission

The ZIP contains the source project, not a published GitHub repository. Create a repository in your own GitHub account, then from this folder run:

```bash
git init
git add .
git commit -m "Build secure insurance platform lab"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/northstar-insurance-platform.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username and submit that repository URL with the report and screenshots. Do not commit `.env`, generated certificates, `node_modules`, or the runtime JSON database.

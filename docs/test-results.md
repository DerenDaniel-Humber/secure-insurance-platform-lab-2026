# Required test scenarios

The API suite (`backend/test/security.test.js`) exercises the API cases with isolated test data and request simulation. It also starts an HTTPS listener and verifies the health response when a development certificate exists. Run `cd backend && npm run certs && npm test`. The latest run completed with 11 passing test groups, 0 failures, and 0 skipped tests. The Next.js production build completed successfully. Manual browser review is complete. Screenshots for the customer dashboard, policy list, underwriting queue, claims queue, admin controls, and forbidden access response are included below.

| # | Scenario | Expected outcome | Evidence |
|--:|---|---|---|
| 1 | Backend starts using HTTPS | Health route returns `transport: https` | HTTPS integration test; see report |
| 2 | Valid credentials | 200 with signed JWT | Automated API test |
| 3 | Invalid credentials | 401 | Automated API test |
| 4 | Invalid/expired token | 401 | Automated API test |
| 5 | Customer views own profile | 200 | Automated API test |
| 6 | Customer attempts another customer's profile | 403 or not-found on owned policy; no foreign data | Automated API test |
| 7 | Admin lists users | 200 | Automated API test |
| 8 | Admin assigns a role | 200 and updated role list | Automated API test |
| 9 | Non-admin assigns a role | 403 | Automated API test |
| 10 | Customer lists policies | Own policies only | Automated API test |
| 11 | Agent creates a policy | 201 | Automated API test |
| 12 | Underwriter decides an amendment | 200 and stored decision | Automated API test |
| 13 | Non-underwriter decides an amendment | 403 | Automated API test |
| 14 | Customer submits a claim | 201 | Automated API test |
| 15 | Adjuster decides a claim | 200 and stored decision | Automated API test |
| 16 | Non-adjuster decides a claim | 403 | Automated API test |
| 17 | Disabled account uses old token | 401 | Automated API test |
| 18 | Frontend route/navigation role protection | Role-specific tabs; API still enforces access | Manual role review and forbidden-access screenshot |

**Evidence included:** `lab-report.docx` and `lab-report.pdf` contain the customer dashboard, customer policy list, underwriter request queue, adjuster claims queue, administrator user/role page, and a forbidden-access response from a customer account. The HTTPS health response is covered by the automated integration test.

## Current verification record

- Backend test suite: **11 passed, 0 failed, 0 skipped** (includes HTTPS health transport, account disabling, role assignment/removal, ownership, policy creation, underwriting, and claim decision checks).
- Frontend production build: **passed** with Next.js 15.5.29.
- Browser review: **completed** for the customer, underwriter, claims-adjuster, and administrator roles. Six genuine screenshots are in `docs/screenshots/` and embedded in both reports. The HTTPS health route was validated by the integration test. No passwords or bearer tokens appear in screenshots.

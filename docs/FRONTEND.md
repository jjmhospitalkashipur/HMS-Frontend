# JJM HMS — Frontend handover

This document describes the hospital frontend as it exists on the **`dev` branch**. JJM product work lives on `dev`. Other branches are out of scope and may implement different behaviour.

Product name in the UI: **PranaOS**. Hospital context: **JJM Hospital**.

## Scope of this document

| In scope | Out of scope |
| --- | --- |
| `dev` | Feature work that exists only on other branches |
| Screens linked from the live sidebar, their detail/edit routes, and public queue displays | The unused CRM/theme pages still sitting in the repo (blogs, HRM, invoices, UI kit, settings, and so on). Those routes are commented out of the sidebar and are not the JJM product |

The route map in `src/routes/all_routes.tsx` still lists those leftover theme paths. Treat that file as a catalogue, and treat the sidebar plus `src/core/auth/roleAccess.ts` as the product surface.

---

## 1. Framework, structure, routing, and component hierarchy

### Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16, App Router (`src/app`) |
| UI | React 19, TypeScript (`strict`) |
| Styling | Bootstrap 5, project SCSS (`src/style/scss`), Tabler / Font Awesome icons |
| Widgets | Ant Design 5 (`DatePicker`, `TimePicker`), ApexCharts, FullCalendar, react-select |
| HTTP | Axios. A global interceptor in `src/core/api/axiosAuth.ts` is installed by importing `@/environment` |
| Client store | Redux Toolkit. Used only for sidebar chrome and theme settings |
| Path alias | `@/*` → `src/*` |
| Build output | `output: "standalone"` in `next.config.ts` |

There is no React Query, React Hook Form, or Zod in this app. Lists, forms, and API calls use component `useState` / `useEffect` and Axios directly.

### Directory layout

```
src/
  app/                  Next.js routes (thin page files)
  components/
    auth/               Login and the client session guard
    pages/
      clinic-modules/   Appointments, patients, doctors, dialysis, x-ray, pharmacy, procedures
      administration-modules/   Users, wards, beds
      dashboard/        Admin dashboard
      finance-accounts/ Transactions
  core/
    api/                Shared API helpers (medicines, ICD)
    auth/               Session, shared login, role paths
    common/             Sidebar, header, data table, filters, selects
    redux/              Sidebar and theme slices
    utils/              Phone, tokens, print, uploads
  routes/all_routes.tsx Named path constants
  environment.tsx       Public env exports; also loads the Axios interceptor
  proxy.ts              Server cookie gate (Next.js 16 proxy, not middleware.ts)
```

### Route groups

```
src/app/layout.tsx                         Root: Redux provider, Bootstrap, global CSS
src/app/page.tsx                           "/" session redirect

src/app/(auth)/                            Login and error screens. No sidebar
src/app/(feature-module)/layout.tsx        Authenticated shell: guard + sidebar + role redirect
src/app/(display)/                         Public TV queues. No sidebar, no login
src/app/(layout)/                          Older theme-layout shell. Not the live JJM menu
```

A typical page is a thin client file that renders one screen component:

```tsx
"use client";
import DoctorsListComponent from "@/components/pages/clinic-modules/doctors-list/doctorsList";

export default function DoctorsListPage() {
  return (
    <div>
      <DoctorsListComponent />
    </div>
  );
}
```

Pages that read `useSearchParams` (new appointment, dialysis session) wrap the screen in `<Suspense>`.

### Shell hierarchy

```
html
  Providers (Redux)
    Route group layout
      AuthRouteGuard          feature-module and (layout) only
        Sidebar               filtered by role
        Page component
          Data table / form / modals / print views
```

The header component exists (`src/core/common/header/header.tsx`) but is not mounted in the feature-module layout. The signed-in name, role, and logout sit at the bottom of the sidebar. A fixed menu button is shown below the `lg` breakpoint.

### Component hierarchy by module

| Module | Route file | Screen component |
| --- | --- | --- |
| Login | `src/app/(auth)/login/page.tsx` | `src/components/auth/login/login.tsx` |
| Dashboard | `src/app/(feature-module)/(dashboard)/dashboard/page.tsx` | `src/components/pages/dashboard/dashboard/dashboard.tsx` |
| New appointment | `.../new-appointment/page.tsx` | `clinic-modules/new-appointment/newAppointment.tsx` |
| OPD list | `.../appointments/page.tsx` | `clinic-modules/appointments/appointments.tsx` |
| OPD details | `.../appointment-details/[id]/page.tsx` | `.../appointment-details/appointmentDetails.tsx` |
| OPD edit | `.../edit-appointment/[id]/page.tsx` | `.../edit-appointment/editAppointment.tsx` |
| Daycare list / details / edit | matching `daycare-*` pages | `clinic-modules/daycare-appointments/` |
| IPD list / details / edit | matching `ipd-*` pages | `clinic-modules/ipd-appointments/` |
| Patients / patient details | `patients`, `patient-details` | `clinic-modules/patients`, `patient-details` |
| Doctors | `doctors-list`, `add-doctor`, `edit-doctor` | `doctors-list`, `add-doctor`, `doctors/modals` |
| Procedures | `procedures`, `add-procedure`, `procedure-details` | `clinic-modules/procedures`, `add-procedure` |
| Users | `users`, `users/create` | `administration-modules/users` |
| Wards / beds | `wards`, `beds` | `administration-modules/wards`, `beds` |
| Transactions | `transactions` | `finance-accounts/transactions.tsx` |
| Dialysis list / calendar | `dialysis`, `dialysis-calendar` | `clinic-modules/dialysis/` |
| Dialysis session form | `dialysis-appointment` | `src/app/(feature-module)/dialysis-appointment/page.tsx` (form lives in the page) |
| X-ray list / details | `xrays`, `xray-details/[id]` | `clinic-modules/xrays/` |
| Pharma tokens | `pharma-tokens` | `clinic-modules/pharma-tokens/pharmaTokens.tsx` |
| OPD queue | `(display)/qd/[doctorId]`, `qd-all/[page]`, `qd/ad` | `queue-display/` |
| Pharma queue | `(display)/pq` | `pharma-token-queue/pharmaTokenQueue.tsx` |
| X-ray queue | `(display)/xq` | `xray-token-queue/xrayTokenQueue.tsx` |

Shared UI used across lists:

- `src/core/common/dataTable` — Ant Design table wrapper, search, pagination
- `src/core/common/common-select` — react-select
- `src/core/common/filter` — Bootstrap filter dropdown sync
- `src/core/common/indianPhoneInput` — Indian mobile input
- Print helpers: `printReceipt.tsx`, `printPrescription.tsx`, `printDischargeSummary.tsx`, `printXrayReport.tsx`, `thermalTokenPrint.ts`, `DialysisPrintView.tsx`

---

## 2. Page-wise and module-wise functionality

### Live sidebar (admin)

**Clinical**

- Dashboard
- Appointments (OPD visits)
- Daycare Appointments
- IPD Appointments
- Pharma Appointments
- Dialysis
- Dialysis Calendar
- Xrays
- Patients
- Pathlab (external link, admin only)

**Administration**

- Procedures
- Doctors
- Users
- Wards
- Beds
- Transactions

A “New Appointment” button in the sidebar is shown only to `ADMIN`, `ABDM_ADMIN`, and `RECEPTIONIST`.

Non-admin roles see a filtered copy of this menu. See section 5.

### Home and login

| Route | Behaviour |
| --- | --- |
| `/` | If shared auth is on and there is no local token, calls `GET /me`. Then redirects. `RECEPTIONIST` goes to `/appointments`. Every other signed-in user goes to `/dashboard`. No token goes to `/login`. |
| `/login` | Email and password. Shared auth when configured, otherwise `POST /hospital/auth/login`. After success, `getDefaultRouteForRole` picks the landing page. |

`/` and `/login` do not use the same landing rule. Login sends dialysis, pharmacy, x-ray, accountant, and receptionist-2 users to their own home. The `/` page sends everyone except receptionist to the dashboard, and the feature layout then bounces them if that path is not allowed.

### Dashboard — `/dashboard`

Loads, independently:

- Overview cards: doctors, patients, visits, revenue, each with a growth rate
- Recent visits (limit 6) and recent transactions (limit 5)
- OPD visit statistics chart (`period`, optional `from` / `to`)
- Daycare statistics chart (`range`, optional `from` / `to`)

Visit statuses shown on the dashboard: Scheduled, In Progress, Completed, Cancelled, No Show.

### New appointment — `/new-appointment`

One screen with three tabs: **OPD**, **Daycare**, and **IPD**. IPD is controlled by `IPD_APPOINTMENT_TAB_ENABLED` (currently `true`) inside `newAppointment.tsx`. Query `?tab=daycare` or `?tab=ipd` opens that tab.

Shared behaviour:

- Search an existing patient by Indian mobile, or register a new patient in the same submit
- Doctor list from the API; charge comes from the doctor’s visit-type pricing
- Payment capture creates a transaction (Cash, UPI, Card)

**OPD** posts to `/hospital/visits` for an existing patient, or `/hospital/visits/with-patient` for a new one. Visit types: New, Emergency, Follow-up, Follow-up report, MR.

**Daycare** posts to `/hospital/daycare-appointments` or `.../with-patient`. Procedure list is loaded from `/hospital/procedures`. A dialysis procedure also requires a doctor dialysis slot.

**IPD** posts to `/hospital/ipd`. Extra steps: ward and bed selection, MLC fields, procedure rows, doctor visiting-charge rows, extra charges, and a compact patient document upload to `/upload/pathlab`.

### OPD appointments — `/appointments`

Paginated visit list with search, date/doctor filters, All vs Today, status change, export, delete, thermal token print, and row navigation to details.

Detail `/appointment-details/[id]` loads `GET /hospital/visits/:id`. From there staff can add a payment, change a transaction’s payment mode, print a receipt, and start a convert-to-IPD flow.

Edit `/edit-appointment/[id]` patches the visit.

### Daycare — `/daycare-appointments`

List, export, delete, procedure filter. Detail and edit mirror OPD, against `/hospital/daycare-appointments`. Edit can post a follow-up transaction. Dialysis slot helpers live in `daycareDialysisSlots.ts`.

### IPD — `/ipd-appointments`

List, export, delete. Detail loads the admission and, when needed, the patient. Staff can record payments, change payment mode, save a discharge summary (`PUT .../discharge-summary`), and confirm final discharge (`POST .../discharge`). Printable discharge summary is a separate view. Edit is `/edit-ipd-appointment/[id]`.

Bed occupancy used by the admission form comes from the IPD bed-block helpers under `ipd-appointments/ipd-bed-selection/`.

### Patients — `/patients`

Paginated list. Filters: created-from, created-to, MR-only (`isMRPatient`), and text search. Row opens `/patient-details?id=...` (query param, not a path id).

Patient details tabs:

- Appointments (OPD visits for that patient)
- IPD
- Transactions
- Dialysis
- Pathlab cases

The page can update the patient with `PUT` via `buildPatientUpdatePayload`.

### Doctors — `/doctors-list`

List with status, department, and date filters. Add (`/add-doctor`, `POST /hospital/doctors`) and edit (modal `PUT` / `PATCH /hospital/doctors/:id`) cover profile, department, designation, and visit-type charges. `/doctors` still mounts an older doctors screen; the sidebar points at `/doctors-list`.

### Procedures — `/procedures`

Catalogue used by daycare, IPD, dialysis, and x-ray. List, create (`POST /hospital/procedures`), patch from the modal, and a details page. Fields include name, category, price, nursing charges, and room charges.

### Users — `/users`

Admin user list. Create (page and modal) and edit send `POST` / `PATCH /hospital/users`. Delete is `DELETE /hospital/users/:id`.

Roles offered in the user form:

`ADMIN`, `ABDM_ADMIN`, `ACCOUNTANT`, `RECEPTIONIST`, `RECEPTIONIST2`, `DIALYSIS`, `PHARMACIST`, `XRAY`.

`DOCTOR` is recognised by the route guard but is not in this dropdown.

### Wards and beds

- `/wards` — list, create, update, delete `/hospital/wards`
- `/beds` — list beds with their ward, create, update, delete `/hospital/beds`. Ward options come from the wards API

### Transactions — `/transactions`

Ledger of payments across OPD (`visit`), daycare (`daycareAppointment`), and IPD (`IPD`). Filters include payment mode (Cash, UPI, Card), source type, department, and visit type. Export calls `/hospital/transactions/export`.

### Pharma appointments — `/pharma-tokens`

Token list for the pharmacy counter. Statuses: Created, InProgress, PayNow, Completed, Cancelled. Staff can create a token (patient search) and patch status. Thermal token print is available. The public display is `/pq`.

### Dialysis

- `/dialysis` — session list. Status updates go to `PUT /hospital/dialysis-session/:id`. Receipt print can pull the linked daycare or IPD appointment.
- `/dialysis-calendar` — calendar of sessions, with doctor filter.
- `/dialysis-appointment` — clinical session form: general information, pre-dialysis assessment, monitoring readings, post-dialysis assessment, complications, treatment given. Creates with `POST /hospital/dialysis-session` or updates with `PUT`. Opens a print window through `DialysisPrintView.tsx`.

### X-ray

- `/xrays` — session list. Status is Pending, In Progress, or Completed (`PUT /hospital/xray-session/:id`).
- `/xray-details/[id]` — report entry and image upload to `/upload/pathlab?folder=hospital/xray`, then save. Printable report via `printXrayReport.tsx`.
- Public display: `/xq`.

### Public queue displays

These routes skip login (see public paths in section 5). They use `EventSource` against the API and reconnect with an on-screen “connection lost” message.

| Route | Stream |
| --- | --- |
| `/qd/[doctorId]` | `GET /hospital/visits/display/stream/:doctorId` |
| `/qd-all/1` and `/qd-all/2` | One stream per doctor, plus the pharma stream on the multi display |
| `/qd/ad` | Advertisement / poster view |
| `/pq` | `GET /hospital/pharma-tokens/stream` |
| `/xq` | `GET /hospital/xray-sessions/stream?date=` |

OPD queues sort by token or visit time, split emergency vs regular, and rotate views. Doctor names are mapped to JJM department labels in `mapDoctorToJjmDepartment.ts`.

### Pathlab

Sidebar item is an external URL (`PATHLAB_PORTAL_BASE_URL`). It is shown only to admin-equivalent roles. Non-admin roles cannot open `http` sidebar links.

---

## 3. API integration and request / response handling

### Base URL

All hospital calls use `API_BASE_URL` from `src/environment.tsx`, which reads `NEXT_PUBLIC_API_BASE_URL`. Paths are appended as `` `${API_BASE_URL}/hospital/...` ``. The value already includes `/api/v1`, so components do not add another version prefix.

If `API_BASE_URL` is missing, screens set a local error such as “API configuration error” and skip the request.

### Auth header and timeout

`src/core/api/axiosAuth.ts` runs once in the browser:

- Default timeout is 15 seconds. Override with `NEXT_PUBLIC_API_TIMEOUT_MS`.
- Request interceptor sets `Authorization: Bearer <authToken>` from `localStorage` when the header is not already set.
- `ECONNABORTED` becomes “Request timeout after {ms}ms”.
- HTTP 504 becomes “Upstream server timeout (504). Please try again.”
- Other errors are rejected unchanged. There is no global 401 logout.

Shared-auth calls use a separate Axios instance (`sharedAuthClient`) with `withCredentials: true`. They do not rely on the Bearer header for the cookie session.

### Response shape

Successful hospital JSON is treated as:

```json
{
  "code": 200,
  "message": "optional",
  "data": {}
}
```

List endpoints usually put the array and pagination on `data`:

```json
{
  "code": 200,
  "data": {
    "patients": [],
    "pagination": {
      "currentPage": 1,
      "limit": 10,
      "count": 10,
      "totalCount": 120,
      "hasMore": true
    }
  }
}
```

Call sites are not fully uniform. Some require `response.data.code === 200`. Others accept any HTTP 2xx and then read `response.data.data`. Pagination field names vary (`total`, `totalCount`, `count`, `hasMore`). Each list normalises that locally.

Errors are read from `error.response.data.message`, with a screen-specific fallback string.

### How a list call is made

Pattern used by patients, visits, daycare, IPD, users, and similar screens:

1. Keep `page`, `limit`, `searchText`, and applied filters in state.
2. `useEffect` refetches when those change.
3. Build a `params` object and `axios.get`.
4. On success, store rows and total. On failure, `console.error` and/or `setError`.
5. `finally` clears the loading flag.

Search is passed as `params.search`. Dates are `YYYY-MM-DD` strings from Ant Design `DatePicker` / dayjs.

### Writes

| Action | Method and path |
| --- | --- |
| OPD visit, existing patient | `POST /hospital/visits` |
| OPD visit, new patient | `POST /hospital/visits/with-patient` |
| Update OPD visit | `PATCH /hospital/visits/:id` |
| Delete OPD visit | `DELETE /hospital/visits/:id` |
| Export OPD | `GET /hospital/visits/export` |
| Daycare create | `POST /hospital/daycare-appointments` or `.../with-patient` |
| Daycare update / delete / export | `PUT`, `DELETE`, `GET .../export` on `/hospital/daycare-appointments` |
| IPD create | `POST /hospital/ipd` |
| IPD list / get / delete / export | `/hospital/ipd` |
| Discharge summary | `PUT /hospital/ipd/:id/discharge-summary` |
| Final discharge | `POST /hospital/ipd/:id/discharge` |
| Payment | `POST /hospital/transactions` |
| Change payment mode | `PATCH /hospital/transactions/:id` |
| Transaction list / export | `GET /hospital/transactions`, `GET .../export` |
| Patient get / update / list | `/hospital/patients`, `PUT` or `PATCH /hospital/patients/:id` |
| Doctors | `GET/POST /hospital/doctors`, `PUT` and `PATCH /hospital/doctors/:id` |
| Procedures | `GET/POST /hospital/procedures`, `PATCH /hospital/procedures/:id` |
| Users | `GET/POST /hospital/users`, `PATCH` and `DELETE /hospital/users/:id` |
| Wards / beds | `/hospital/wards`, `/hospital/beds` |
| Pharma token | `GET/POST /hospital/pharma-tokens`, `PATCH /hospital/pharma-tokens/:id` |
| Dialysis sessions | `GET /hospital/dialysis-sessions`, `POST/PUT /hospital/dialysis-session` |
| X-ray sessions | `GET /hospital/xray-sessions`, `GET/PUT /hospital/xray-session/:id` |
| File upload | `POST /upload/pathlab?folder=...` as `multipart/form-data` |
| Medicines | `GET /hospital/medicines`, `GET /hospital/medicines/types`, `POST /hospital/medicines/import` |
| ICD search | `GET /hospital/icd/search` |
| Dashboard | `/hospital/dashboard/overview`, `recent-visits`, `recent-transactions`, `visit-statistics`, `daycare-statistics` |

Uploads and some clinical forms send `FormData`. JSON bodies are plain objects built in the submit handler.

### Streaming

Queue pages use the browser `EventSource` API. The stream URL is the API base plus the path in the table above. These displays are public, so they do not depend on the `hms_auth` cookie. A dropped socket sets an error string and the effect reconnects.

### Shared API modules

| File | Role |
| --- | --- |
| `src/core/api/axiosAuth.ts` | Global interceptor |
| `src/core/api/medicineApi.ts` | Medicine types, search, import |
| `src/core/api/icdApi.ts` | ICD search |
| `src/core/utils/uploadFileToS3.ts` | Upload helper used alongside the pathlab upload endpoint |
| `src/core/auth/sharedAuth.ts` | Shared login, `/me`, logout |

---

## 4. State management, form validation, and error handling

### State

| Kind of state | Where it lives |
| --- | --- |
| Signed-in user and token | `localStorage` keys `authToken` and `authUser` |
| Server “has a session” bit for the proxy | Cookie `hms_auth=1` (7 days, `SameSite=Lax`, `Secure` on HTTPS) |
| Sidebar open / mini / expand | Redux `sidebarSlice` |
| Theme attributes | Redux `themeSlice`, also written to cookies |
| Every list, form, modal, and loading flag | `useState` inside that screen |
| Server cache | None. Each visit refetches |

`src/core/redux/store.tsx` registers only `sidebarSlice` and `theme`. Do not expect Redux to hold patients, visits, or the current user.

### Forms

Forms are controlled inputs. Submit handlers validate before the request and set a string error on the component.

Examples:

- Login: email and password required; missing API base URL is its own error.
- Indian mobile: `validateIndianMobilePhone` and `formatPatientPhoneForApi` in `src/core/utils/formatPatientPhoneForApi.ts`.
- Daycare edit: appointment date required; dialysis procedure requires a slot.
- New appointment: patient, doctor, visit type, and amount checks run before `POST`. Failures call `setError` and do not navigate.
- User create: role defaults to `RECEPTIONIST`.

There is no shared schema library. Required-field rules live next to the submit function of each screen.

Select options that are product data (departments, genders, visit types, marital status) are in `src/core/common/selectOption.tsx`. Some entries in that file are leftover theme placeholders (sample doctor names). Live doctor lists come from the API.

### Errors and loading

- Lists: `loading` boolean, table spinner, `console.error` on failure. Several lists do not surface an inline message.
- Detail pages: `error` string rendered in the page (appointment, daycare, IPD).
- Mutations: `setError(err.response.data.message || "<fallback>")`. Buttons disable while `saving` / `loading` is true.
- Login: Bootstrap `alert-danger`.
- Queues: status text for disconnect, then reconnect.
- `src/core/common/ErrorBoundary.tsx` renders “Something went wrong” after a render error and logs the stack. It is not wrapped around the root layout, so it only helps where a parent mounts it.
- Pop-up print: if `window.open` is blocked, `thermalTokenPrint` calls `alert` asking the user to allow pop-ups.
- Axios timeout and 504 are rewritten in the interceptor (section 3). A 401 does not clear the session by itself.

Empty API payloads set the list to `[]` or the detail error to “not found”. Dashboard chart fetches fail quietly and keep the previous or default series.

---

## 5. Authentication, session, and role-based UI

### Two login modes

Shared auth is on when either of these is set:

- `NEXT_PUBLIC_SHARED_AUTH_BASE_URL` (preferred), or
- `NEXT_PUBLIC_USE_SHARED_AUTH=true`, which uses `{API_BASE_URL}/shared/auth`

The current local `.env.local` enables both.

**Shared auth (current dev setup)**

1. `POST {SHARED_AUTH_BASE_URL}/login` with `{ email, password }` and credentials.
2. Response user is normalised so `role` is `user.role` or the first entry of `user.roles`.
3. `accessToken` → `localStorage.authToken`. User JSON → `localStorage.authUser`.
4. `hms_auth=1` cookie is set.
5. Router pushes `getDefaultRouteForRole`.

On later visits, `GET {base}/me` restores the same localStorage keys when the shared cookie is still valid. Login, `/`, and `AuthRouteGuard` all attempt this when there is no local token.

**Direct hospital login (fallback if shared auth is off)**

`POST {API_BASE_URL}/hospital/auth/login`. Token is read from `data.accessToken` or `accessToken`. User is read from `data.user`.

### Logout

Sidebar (and the unused header) call `POST {shared}/logout` when shared auth is on, then `clearLocalAuthSession()` which removes both localStorage keys and the `hms_auth` cookie. Logout still clears local state if the network call fails.

### Three gates

They are independent. A user can pass one and fail another.

**1. Server proxy — `src/proxy.ts`**

Runs on document requests. Public paths continue. Any other path without `hms_auth=1` redirects to `/login`. The cookie is only a presence flag. It does not carry the role or the JWT.

Public prefixes (`src/core/auth/publicPaths.ts`):

`/`, `/login`, `/error-404`, `/error-500`, `/coming-soon`, `/under-maintenance`, `/pq`, `/xq`, `/qd`, `/qd-all`, `/jjm-signage`.

Static assets, `/_next`, and `jjm-signage` files are excluded by the matcher.

**2. Client guard — `AuthRouteGuard`**

On each path change it may sync `/me`, then checks `authToken` or `authUser`. While that runs, the shell shows “Loading...”. If the path is not public and storage is empty, it renders `NotFoundScreen` instead of redirecting. A valid session refreshes the cookie.

**3. Role guard — feature-module layout**

After auth, `canAccessPath(role, pathname)` runs. A forbidden path is replaced with `getDefaultRouteForRole`. Unknown roles are sent to `/login`.

`ADMIN` and `ABDM_ADMIN` (`isAdminRole`) may open any path. Nested routes match by prefix, so `/appointment-details/abc` is allowed when `/appointment-details` is allowed.

### Role matrix

| Role | Landing route after login | Allowed areas |
| --- | --- | --- |
| `ADMIN`, `ABDM_ADMIN` | `/dashboard` | Entire app, including external Pathlab |
| `RECEPTIONIST` | `/new-appointment` | New appointment, OPD, daycare, IPD, patients, dialysis calendar, appointment calendar |
| `RECEPTIONIST2` | `/patients` | Patients only |
| `DOCTOR` | `/appointments` | OPD, daycare, IPD, dialysis calendar. No patient registration and no new-appointment button |
| `DIALYSIS` | `/dialysis` | Dialysis list, calendar, session form, patients |
| `PHARMACIST` | `/pharma-tokens` | Pharma tokens and `/pq` |
| `XRAY` | `/xrays` | X-ray list, details, and `/xq` |
| `ACCOUNTANT` | `/transactions` | Dashboard, transactions, and the finance/report paths listed in `ROLE_PATH_PREFIXES` |
| Anything else | `/login` | None |

Every authenticated role may also open profile, notification, `/pq`, and `/xq` via `COMMON_AUTH_PATH_PREFIXES`.

The sidebar is the same data as the admin menu, passed through `filterSidebarSubmenuItems`. External URLs are removed for non-admins. Items whose link the role cannot open are dropped. Empty groups disappear.

`canShowNewAppointmentSidebarCta` is admin or receptionist only.

### Session storage shape

`authUser` is the API user object plus a normalised `role` string. The sidebar reads `name` or `username`, and `role`. Role comparisons always go through `normalizeRole` (trim + uppercase), except the `/` page and the older `(layout)` shell, which uppercase inline and only special-case `RECEPTIONIST`.

The JWT is not decoded on the client. Expiry is whatever the API enforces on the next call.

---

## 6. Environment configuration and build

### Environment variables

All of these are `NEXT_PUBLIC_*`, so they are inlined into the browser bundle at build time. Changing them requires a rebuild.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Hospital API origin including `/api/v1`. No trailing slash assumed by callers that concatenate paths |
| `NEXT_PUBLIC_SHARED_AUTH_BASE_URL` | Yes for shared login | Shared auth origin, no trailing slash. Example shape: `{API}/shared/auth` |
| `NEXT_PUBLIC_USE_SHARED_AUTH` | Optional | `"true"` enables shared auth using `{API_BASE_URL}/shared/auth` when the dedicated base URL is empty |
| `NEXT_PUBLIC_PATHLAB_PORTAL_BASE_URL` | Optional | Pathlab portal. Default in code: `https://lab.jjmhospitalkashipur.com` |
| `NEXT_PUBLIC_PATHLAB_PORTAL_LOGIN_URL` | Optional | Used for wrong-session messaging. Defaults to `{PATHLAB}/login-cover` |
| `NEXT_PUBLIC_API_TIMEOUT_MS` | Optional | Axios timeout. Default 15000 |

Local development reads `.env.local` (not committed). On this machine it points the API and shared auth at the Kilobyte **dev** host and sets `NEXT_PUBLIC_USE_SHARED_AUTH=true` and a dev Pathlab portal URL. Do not copy that file into a production build.

`src/environment.tsx` is the only module that should be imported for these values. It also side-effect-imports the Axios interceptor.

`base_path` and `img_path` in that file (`/nextjs/template/`) belong to the original theme and are not the API.

### Scripts

From `package.json`:

| Script | Command | Use |
| --- | --- | --- |
| `npm run dev` | `next dev` | Local dev server, default port 3000 |
| `npm run build` | `next build` | Production build. Emits a standalone server under `.next/standalone` |
| `npm start` | `next start` | Serves a build that was produced without relying on standalone packaging |
| `npm run lint` | `eslint` | Lint |
| `npm run audit:ci` | `npm audit --omit=dev --audit-level=high` | CI gate |
| `npm run inventory` / `npm run sbom` | inventory scripts | Dependency inventory and CycloneDX SBOM |

Node image in GitLab CI is **Node 22**. Install with `npm ci`.

### CI (`.gitlab-ci.yml`)

| Job | When | What it does |
| --- | --- | --- |
| `dependency-inventory` | merge requests, schedules, default branch, `dev`, `production` | `npm ci`, inventory JSON, SBOM |
| `dependency-audit` | same | `audit:ci`, then a non-blocking full audit |
| `release` | `dev` only | `semantic-release`, then a Slack note when a new tag appears |

The GitLab release job does not run `next build`. A deployable frontend is `npm ci && npm run build` with the target `NEXT_PUBLIC_*` values present in the environment **before** `next build`.

Standalone output is configured so a container can run `node server.js` from the standalone folder after the static assets are copied next to it, which is the usual Next.js standalone layout. This repo’s `next.config.ts` does not add image domains, rewrites, or a custom asset prefix.

### Typecheck and lint

`tsconfig.json` is `strict`, `jsx: react-jsx`, incremental, Next plugin. ESLint uses `eslint-config-next` 16. There is no unit-test script in `package.json`.

---

## Handover notes

- Product navigation is the sidebar in `sidebarData.tsx`, not every path in `all_routes.tsx`.
- Role rules have one source: `src/core/auth/roleAccess.ts`. The `/` page and `src/app/(layout)/layout.tsx` still contain an older receptionist-only check. The live clinic shell is `(feature-module)/layout.tsx`.
- Queue TVs must stay on the public-path list. Putting them behind the cookie gate will blank the displays.
- Payments, receipts, and thermal tokens assume the browser can open a print window.
- Dates in lists are formatted with dayjs. Patient details, daycare, and IPD lists format instants in IST through `src/core/utils/dayjsIST.ts` (`formatInstantInIST`, `todayISODateInIST`).
- `DOCTOR` can be enforced by the guard but cannot be assigned from the Users screen.

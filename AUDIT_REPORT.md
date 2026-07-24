# School Management System (SMS) - Comprehensive Audit Report

This report presents a thorough audit of the School Management System codebase, covering **Feature Gaps & Disconnected Flows**, **Security Vulnerabilities**, and **Performance Bottlenecks**. Detailed recommendations and remediation steps are provided for each issue identified.

---

## 1. Feature Gaps & Disconnected Flows

### 1.1 Invitation & Account Setup Disconnection
* **Location:** `src/app/setup-account/page.js`
* **Finding:** When a newly invited staff member goes to `/setup-account` to register, they submit their credentials via `createUserWithEmailAndPassword(auth, email, password)`, and their Firestore user profile is successfully created with their designated role and `schoolId`. However, **the application never updates their Firebase Auth Custom Claims**.
* **Impact:**
  * The newly registered user's custom claims (`role` and `schoolId`) inside their Firebase ID Token remain `null` or empty.
  * When `AuthContext.js` is loaded on subsequent page routing, `tokenResult.claims.role` is read as `null`.
  * The user is incorrectly redirected or locked out by the `ProtectedRoute` component, which checks the role via custom claims.
* **Remedy:** Modify the registration submission handler in `src/app/setup-account/page.js` to trigger a POST request to `/api/auth/set-custom-claims` with the user's `uid`, `role`, and `schoolId` right after successfully creating the user auth account and profile.

### 1.2 Broken Admin Provisioning Flow
* **Location:** `src/app/super-admin/users/page.js`
* **Finding:** The primary school admin provisioning page generates a client-side mock UID (`user_${Date.now()}_...`) and posts this mock UID to the set-custom-claims API endpoint. It then saves a user profile under this UID in Firestore. However, **it never invokes the Firebase Authentication API to register the actual credentials**.
* **Impact:**
  * No Firebase Auth record is created with the email address and temporary password.
  * The "Temporary Password" is lost immediately after form submission.
  * The provisioned school admin cannot log in because their credentials do not exist in Firebase Authentication.
* **Remedy:** Transition the provisioning flow to use the Firebase Admin SDK on the server (e.g. creating a secure API route `/api/auth/create-user` that registers the user with `adminAuth.createUser({ email, password, displayName })`, sets custom claims, creates the Firestore document, and returns the real `uid`).

---

## 2. Security Vulnerabilities

### 2.1 Critical Privilege Escalation Risk (Unauthenticated Custom Claims API)
* **Location:** `src/app/api/auth/set-custom-claims/route.js`
* **Finding:** This API route accepts `uid`, `role`, and `schoolId` in the request body and modifies custom claims using the Admin SDK. **There are absolutely no authentication or authorization checks performed on this endpoint.**
* **Impact:**
  * Any unauthenticated user, external public client, or bot can send a POST request with an arbitrary `uid` and elevate any account's privileges to `SUPER_ADMIN` or `SCHOOL_ADMIN`.
  * This is a massive security vulnerability that guarantees total system compromise.
* **Remedy:** Ensure that this endpoint parses the incoming `Authorization` header, verifies the caller's Firebase ID token via `adminAuth.verifyIdToken(token)`, checks that the caller has `SUPER_ADMIN` credentials (from their own custom claims), and rejects any unauthorized or unauthenticated requests with `401 Unauthorized` or `403 Forbidden`.

### 2.2 Lack of Firebase Security Rules (Firestore & Storage)
* **Location:** Project configuration (Missing `firestore.rules` and `storage.rules`)
* **Finding:** No Firebase Firestore or Storage rules are declared or tracked in the codebase.
* **Impact:**
  * Without strict rules, the database is vulnerable to direct client-side modification.
  * A logged-in user can bypass client-side code checks and use the browser console to alter, delete, or retrieve arbitrary documents across other schools' collections (bypassing multi-tenant isolation).
* **Remedy:** Write and deploy robust rules files. Specifically restrict document reads/writes based on matching the client's auth claim `request.auth.token.schoolId` with the document's `schoolId` field.

---

## 3. Performance Bottlenecks

### 3.1 Client-Side Sorting & Bulk Retrieval of Activity Logs
* **Location:** `src/firebase/db/logs.js` (`getActivityLogs`)
* **Finding:** The query fetches **every single activity log entry** in the `activity_logs` collection and sorts them on the client-side via JavaScript arrays:
  ```javascript
  const q = query(collection(db, COLLECTION_NAME));
  const snapshot = await getDocs(q);
  ...
  return logs.sort((a, b) => (b.createdAtStr || '').localeCompare(a.createdAtStr || ''));
  ```
* **Impact:** As logging actions grow over time, fetching and sorting thousands of log entries in-memory will cause severe network lag, slow UI rendering, and extremely high Firestore read fees.
* **Remedy:** Order logs server-side and limit results to the requested count:
  ```javascript
  const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'), limit(maxLogs));
  ```

### 3.2 Inefficient In-Memory Filtering in Defaulters Report
* **Location:** `src/firebase/db/reports.js` (`getDefaulters`)
* **Finding:** To identify student fee defaulters, the system queries **all students** under the school and matches them against unpaid invoices on the client:
  ```javascript
  const q2 = query(collection(db, STUDENTS_COL), where('schoolId', '==', schoolId));
  const stuSnapshot = await getDocs(q2);
  ```
* **Impact:** This approach does not scale. As student bodies grow to thousands, downloading the entire student list on every report fetch causes significant load times and high API costs.
* **Remedy:** Fetch only the relevant student profiles (e.g., chunking the list of student IDs in groups of 30, or fetching them in parallel batches), or denormalize basic student metadata (name, contact info) directly inside the `invoices` collection.

### 3.3 Redundant Database Reads on Route Navigation
* **Location:** `src/context/AuthContext.js`
* **Finding:** On every page navigation or session check, the `onIdTokenChanged` listener triggers, performing sequential Firestore read requests for both user profiles (`getUserProfile`) and school information (`getSchoolById`) to apply dynamic theme styles.
* **Impact:** Produces unnecessary, excessive reads of static dynamic branding details on every state update.
* **Remedy:** Cache the branding config (`primaryColor`, `secondaryColor`) and user profile in client-side state or `localStorage`/`sessionStorage` and verify cache validity before querying Firestore.

---

## Summary of Recommendations

| Priority | Issue / Vulnerability | Classification | Impact | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **CRITICAL** | Unsecured Custom Claims Endpoint | Security | Total System Hijack | Implement ID Token verification and role check |
| **HIGH** | Missing Firebase Rules | Security | Data Leak / Manipulation | Define multi-tenant rules for Firestore/Storage |
| **HIGH** | Disconnected Account Setup | Feature Gap | Locked-out users | Call Custom Claims endpoint after signup |
| **HIGH** | Broken Provisioning Logic | Feature Gap | Broken login flows | Use Admin SDK to create real Auth records |
| **MEDIUM** | In-Memory Log Sorting | Performance | Unscalable database reads | Add `orderBy` and `limit` to Firestore queries |
| **MEDIUM** | Defaulters Report Student Fetch | Performance | High network load | Denormalize student info or target specific IDs |
| **LOW** | Redundant dynamic styling reads | Performance | Redundant Firestore reads | Implement state/localStorage cache for themes |

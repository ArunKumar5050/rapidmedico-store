# 📋 RapidMedico Store — Project Reference Guide

> **Purpose:** Complete reference document covering architecture, data models, navigation, services, state, and patterns.  
> Last updated: September 2026

---

## 📌 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [App Entry & Error Handling](#app-entry--error-handling)
5. [Navigation Architecture](#navigation-architecture)
6. [Authentication Flow](#authentication-flow)
7. [Data Models & Enums](#data-models--enums)
8. [Firestore Collections & Schema](#firestore-collections--schema)
9. [State Management (Zustand Stores)](#state-management-zustand-stores)
10. [Services Layer](#services-layer)
11. [Custom Hooks](#custom-hooks)
12. [Order Alert System](#order-alert-system)
13. [KYC Flow](#kyc-flow)
14. [Notifications Setup](#notifications-setup)
15. [Theme & Design Tokens](#theme--design-tokens)
16. [Validation Schemas](#validation-schemas)
17. [App Constants](#app-constants)
18. [EAS / Build Config](#eas--build-config)
19. [Known Patterns & Gotchas](#known-patterns--gotchas)

---

## Project Overview

**RapidMedico Store** is a React Native (Expo) mobile app for **pharmacy/medical store owners**. It is the **store-side partner app** in the RapidMedico ecosystem. Stores receive, manage, and fulfill medicine orders from customers.

### Core Responsibilities
- Receive real-time order alerts from the platform
- Accept/reject orders with reasons
- Update order workflow status (Preparing → Ready → Delivery)
- Verify OTPs for pickup handoff to delivery partners
- Manage inventory stock levels
- Complete KYC onboarding before going live
- Monitor analytics and performance metrics

---

## Tech Stack

| Category | Library / Tool | Version |
|---|---|---|
| Runtime | React Native | 0.86.3 |
| Framework | Expo | ~57.0.20 |
| Language | TypeScript | ~6.0.3 |
| Navigation | React Navigation v6 | 6.x |
| State | Zustand | ^4.5.4 |
| Server State / Cache | TanStack React Query | ^5.51.1 |
| Backend Database | Firebase Firestore | ^10.12.5 |
| Auth | Firebase Auth (Phone + Email) | ^10.12.5 |
| Storage | Firebase Storage | ^10.12.5 |
| Cloud Functions | Firebase Functions (callable) | ^10.12.5 |
| Image CDN | Cloudinary (signed upload) | REST API |
| Push Notifications | Expo Notifications | ~57.0.17 |
| Audio | expo-audio | ~57.0.4 |
| Haptics | expo-haptics | ~57.0.2 |
| Location | expo-location | ~57.0.16 |
| Image Picker | expo-image-picker | ~57.0.16 |
| Forms | react-hook-form + zod | ^7 + ^3 |
| Encryption | crypto-js | ^4.2.0 |

---

## Project Structure

```
rapidmedico-store/
├── index.js                 # Root entry: ErrorBoundary + registerRootComponent
├── App.tsx                  # QueryClientProvider + StatusBar + RootNavigator
├── app.json                 # Expo config (Firebase keys, permissions, plugins)
├── eas.json                 # EAS build profiles
├── google-services.json     # Android Firebase config
├── babel.config.js
├── metro.config.js
├── tsconfig.json
├── assets/
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   ├── notification-icon.png
│   └── sounds/
│       └── new_order_alert.mp3   # Alert sound played on new orders
└── src/
    ├── components/ui/       # Reusable UI components
    ├── constants/           # App-wide constants
    ├── features/            # Feature-based screen modules
    │   ├── analytics/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── inventory/
    │   ├── kyc/
    │   ├── orders/
    │   ├── profile/
    │   └── support/
    ├── hooks/               # Custom React hooks
    ├── nav/navigation/      # All navigators
    ├── services/            # External service integrations
    │   ├── alert/           # Order alert logic
    │   ├── cloudinary/      # Image upload
    │   ├── firebase/        # Firestore, Auth, Functions, Storage
    │   └── notifications.ts # Push token registration
    ├── store/               # Zustand global stores
    ├── theme/               # Design tokens (colors, spacing, typography)
    ├── types/               # TypeScript types and enums
    └── utils/               # Zod validation schemas
```

---

## App Entry & Error Handling

### `index.js` — Root Entry
- Wraps the entire app in a **custom `ErrorBoundary`** (class component) that displays crashes on-screen in development.
- Installs a **global JS error handler** via `global.ErrorUtils.setGlobalHandler` which forwards all unhandled JS exceptions to `console.error` for Metro terminal visibility.
- Calls `registerRootComponent(Root)` to register with Expo.

### `App.tsx` — App Shell
- Creates a global `QueryClient` with:
  - `retry: 2`
  - `staleTime: 1000 * 60 * 5` (5 minutes)
- On mount (Android only): sets `StatusBar` to translucent + transparent.
- Calls `orderAlertService.initializeNotificationChannel()` on startup.
- Renders `<QueryClientProvider>` wrapping `<RootNavigator />`.

---

## Navigation Architecture

```
RootNavigator (NavigationContainer)
│
├── Auth (AuthNavigator) ← when not authenticated
│   ├── Login (LoginScreen)
│   └── OtpVerification (OtpVerificationScreen)
│       └── StoreRegistration (StoreRegistrationScreen)
│
├── KycPending (KycPendingNavigator) ← when authenticated but KYC ≠ APPROVED
│   ├── KycStatus (KycStatusScreen)
│   ├── KycUploadWizard (KycUploadWizardScreen)
│   └── KycReupload (KycReuploadScreen)
│
└── Main (MainNavigator) ← when authenticated + KYC = APPROVED
    ├── MainTabs (TabNavigator)
    │   ├── DashboardTab → DashboardScreen
    │   ├── OrdersTab → OrdersScreen
    │   ├── InventoryTab → InventoryScreen
    │   ├── AnalyticsTab → AnalyticsScreen
    │   └── ProfileTab → ProfileScreen
    ├── OrderDetails → OrderDetailsScreen
    ├── AddMedicine → AddMedicineScreen
    ├── EditMedicine → EditMedicineScreen
    ├── StoreSettings → StoreSettingsScreen
    ├── WorkingHours → WorkingHoursScreen
    ├── PerformanceDashboard → PerformanceDashboardScreen
    ├── Ratings → RatingsScreen
    ├── Support → SupportScreen
    └── Announcements → AnnouncementsScreen
```

### Key Navigator Behaviors
- **`RootNavigator`** also renders `<FullScreenOrderAlertModal>` **outside** the navigator stack — this is always visible globally when `activeAlertOrder != null`.
- **`MainNavigator`** calls `useOrderQueue()` hook on mount — this starts Firestore real-time subscriptions for both active orders and history.
- Navigation to `OrderDetails` from the alert modal uses `navigationRef.navigate('Main', { screen: 'OrderDetails', params: { orderId } })`.
- Tab icons use emoji characters (📊, 📦, 💊, 📈, 👤), not vector icons.
- Tab bar height: `60 + insets.bottom`; background: `#f4f7f5`.

---

## Authentication Flow

### Login Options
1. **Email + Password** via `AuthService.loginWithEmail()`
2. **Phone OTP** via Firebase Phone Auth (`AuthService.sendOtp()` + `AuthService.verifyOtp()`)

### Auth State Machine (`useAuth` hook)
```
Firebase onAuthStateChanged
  └─ user exists?
       ├── YES → getStoreProfile(user.uid) → setStore(profile)
       │         registerPushToken() → updatePushToken(storeId, token)
       └── NO  → logout()
```

### Store Registration
- Done via `StoreRegistrationScreen.tsx` (23KB — the largest screen)
- Creates Firebase Auth user (email/password), then calls `FirestoreService.createStoreUser()` and `createStoreProfile()`
- After registration, user lands in `KycPendingNavigator`

### Auth Persistence
- Firebase Auth persists session via `AsyncStorage` using `getReactNativePersistence(ReactNativeAsyncStorage)`.

---

## Data Models & Enums

### Enums (`src/types/enums.ts`)

#### `OrderStatus`
| Enum Value | String |
|---|---|
| `New` | `'NEW'` |
| `Accepted` | `'ACCEPTED'` |
| `Preparing` | `'PREPARING'` |
| `Ready` | `'READY'` |
| `DeliveryRequested` | `'DELIVERY_REQUESTED'` |
| `DeliveryPartnerAssigned` | `'DELIVERY_PARTNER_ASSIGNED'` |
| `OutOfDelivery` | `'OUT_OF_DELIVERY'` |
| `PickedUp` | `'PICKED_UP'` |
| `Completed` | `'COMPLETED'` |
| `Rejected` | `'REJECTED'` |
| `TimedOut` | `'TIMED_OUT'` |
| `PendingDoctorConfirmation` | `'PENDING_DOCTOR_CONFIRMATION'` |

#### `KycStatus`
`NOT_STARTED` | `PENDING_REVIEW` | `APPROVED` | `REJECTED` | `SUSPENDED_EXPIRED`

#### `KycDocumentType`
`DRUG_LICENSE` | `PAN` | `AADHAAR` | `GST` | `CANCELLED_CHEQUE` | `SHOP_PHOTO` | `OWNER_PHOTO` | `STORE_LOGO`

#### `RejectionReason`
`OUT_OF_STOCK` | `CLOSING_SOON` | `PRESCRIPTION_UNCLEAR` | `CANNOT_FULFILL_QUANTITY` | `OTHER`

#### `AvailabilityStatus`
`ONLINE` | `OFFLINE` | `HOLIDAY`

#### `StoreCategory`
`PHARMACY` | `MEDICAL_STORE` | `CHEMIST`

---

### Key Interfaces (`src/types/models.ts`)

#### `Store`
```ts
{
  storeId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  category: StoreCategory | string;
  city: string;
  kycStatus: KycStatus;
  availability: AvailabilityStatus;
  workingHours: { [day: string]: { open: string; close: string; closed: boolean } };
  logoUrl?: string;
  expoPushToken?: string;
  latitude?: number;
  longitude?: number;
  location?: { latitude: number; longitude: number; address?: string };
}
```

#### `StoreOrder`
```ts
{
  id: string;
  status: OrderStatus;
  customerFirstName: string;
  items: StoreOrderItem[];
  prescriptionUrls?: string[];
  medicineImageUrls?: string[];
  customerNotes?: string;
  respondByAt: string;            // 90s after assignedAt
  rejectionReason?: RejectionReason;
  rejectionNote?: string;
  assignedAt: string;
  totalAmount?: number;
  storePickupOtp?: string;        // OTP for delivery partner to show store on pickup
  deliveryOtp?: string;           // OTP for customer to confirm delivery
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  _collection?: 'orders' | 'customOrders';  // internal routing field
  // PRIVACY: customerPhone, customerEmail, customerAddress are NEVER in this doc
}
```

#### `InventoryItem`
```ts
{ medicineId: string; name: string; genericName?: string; inStock: boolean; lowStock: boolean; priceOverride?: number; }
```

---

## Firestore Collections & Schema

### Top-Level Collections

| Collection | Purpose |
|---|---|
| `stores/{storeId}` | Store profile document |
| `stores/{storeId}/inventory/{medicineId}` | Inventory subcollection |
| `stores/{storeId}/kyc/{docType}` | KYC documents subcollection |
| `stores/{storeId}/performance/summary` | Performance metrics document |
| `store_users/{uid}` | Maps Firebase UID → storeId + role |
| `customOrders` | Primary order collection |
| `orders` | Backup/legacy order collection |
| `announcements` | Platform announcements (global) |

### Order Document Fields (Firestore)
- `status` — customer-app-facing status string (e.g. `'confirmed'`, `'delivery boy assigned'`)
- `storeStatus` — store-app-facing status (`OrderStatus` enum values)
- `storeId` — set when store accepts the order (locks order to this store)
- `billAmount` / `totalAmount` — total price
- `itemizedBill` — array of `{ medicine, qty, unitPrice, price }`
- `deliveryCharge` — fixed at `100` (set on bill generation)
- OTP fields: `storePickupOtp`, `pickupOtp`, `pickupPin`, `deliveryOtp`, `otp` (all may coexist due to legacy compatibility)

### Status Mapping Logic
The `FirestoreService.mapDocToStoreOrder()` method normalizes many raw status strings from Firestore into typed `OrderStatus` enum values. Key mappings:
- `'PENDING'` or `'pending'` → `OrderStatus.New`
- `'confirmed'` → `OrderStatus.Accepted`
- `'paid'` / `'completed'` / `'delivered'` → `OrderStatus.Completed`
- `'cancelled'` → `OrderStatus.Rejected`
- `'delivery boy assigned'` → `OrderStatus.DeliveryPartnerAssigned`
- `'out_for_delivery'` → `OrderStatus.OutOfDelivery`

---

## State Management (Zustand Stores)

### `useAuthStore`
```
store: Store | null
isAuthenticated: boolean
isLoading: boolean
storeId: string | null
phoneNumber: string | null
```
**Actions:** `setStore()`, `setAuthUser()`, `setAvailability()`, `setKycStatus()`, `logout()`

### `useOrderStore`
```
activeOrders: StoreOrder[]
completedOrders: StoreOrder[]
selectedOrder: StoreOrder | null
activeAlertOrder: StoreOrder | null   ← drives FullScreenOrderAlertModal
ignoredAlertOrders: string[]          ← prevents re-alerting dismissed orders
```
**Actions:** `setActiveOrders()`, `setCompletedOrders()`, `setSelectedOrder()`, `setActiveAlertOrder()`, `addIgnoredAlertOrder()`

### `useKycStore`
```
documents: Record<string, KycDocument>  ← keyed by KycDocumentType
currentWizardStep: number
```
**Actions:** `setDocuments()`, `updateDocument()`, `setCurrentWizardStep()`

### `useInventoryStore`
```
items: InventoryItem[]
searchQuery: string
```
**Actions:** `setItems()`, `setSearchQuery()`, `toggleStockLocally(medicineId, inStock)`

---

## Services Layer

### Firebase Services (`src/services/firebase/`)

#### `config.ts`
- Firebase project: **`rapidmedi`**
- Auth persistence via AsyncStorage (`initializeAuth` with `getReactNativePersistence`)
- Safe singleton: uses `getApps().length === 0 ? initializeApp(...) : getApp()`
- Exports: `auth`, `db`, `storage`, `functions`, `analytics`

#### `FirestoreService` (static class)
Key methods:
| Method | Description |
|---|---|
| `getStoreProfile(storeId)` | Fetch store document once |
| `subscribeStoreProfile(storeId, cb)` | Real-time store updates |
| `createStoreProfile(storeData)` | Create store doc (merge: true) |
| `subscribeActiveOrders(storeId, cb)` | Live sub to both `customOrders` + `orders`, filters active statuses |
| `subscribeOrderHistory(storeId, cb)` | Live sub for Completed/Rejected/TimedOut |
| `subscribeOrder(orderId, cb)` | Real-time single order; fallback to `orders` collection |
| `acceptOrder(storeId, orderId, collection)` | Sets `status='confirmed'`, `storeStatus='ACCEPTED'`, locks `storeId` |
| `updateOrderStatus(orderId, nextStatus, collection)` | Dual-field update (storeStatus + customer status string) |
| `updateOrderBill(storeId, orderId, items, total)` | Writes `itemizedBill`, `billAmount`, `deliveryCharge=100` |
| `verifyAndConfirmStorePickup(orderId, otp)` | Validates delivery partner OTP against `storePickupOtp` in DB |
| `subscribeInventory(storeId, cb)` | Real-time inventory updates |
| `updateInventoryStock(storeId, medicineId, inStock)` | Toggle in-stock status |
| `saveKycDocument(storeId, docType, data)` | Upsert KYC doc (merge: true) |
| `subscribeKycDocs(storeId, cb)` | Real-time KYC status |
| `subscribeAnnouncements(cb)` | Latest 20 platform announcements |
| `fetchOrdersForMetrics(storeId)` | All orders for this store (analytics) |
| `getStorePerformance(storeId)` | `stores/{storeId}/performance/summary` |
| `updatePushToken(storeId, token)` | Save Expo push token to store doc |

**Important: OTP generation** happens inside `updateOrderStatus` when transitioning to:
- `READY` or `DELIVERY_REQUESTED` → generates `storePickupOtp` (4-digit random)
- `OUT_OF_DELIVERY` or `DELIVERY_PARTNER_ASSIGNED` → generates a new `deliveryOtp` (4-digit random)

#### `AuthService` (static class)
- `registerWithEmail(email, password)` → `createUserWithEmailAndPassword`
- `loginWithEmail(email, password)` → `signInWithEmailAndPassword`
- `sendOtp(phoneNumber, recaptchaVerifier)` → `signInWithPhoneNumber`
- `verifyOtp(code)` → `confirmationResult.confirm(code)`
- `signOut()` → `firebaseSignOut`
- `onAuthStateChanged(cb)` → subscribes to auth state

#### `FunctionsService` (static class — Firebase Callable Functions)
| Function Name | Cloud Function |
|---|---|
| `submitKyc` | `submitKyc` |
| `respondToOrder` | `respondToOrder` (used for REJECT only in practice) |
| `updateOrderStatus` | `updateOrderStatus` |
| `requestDeliveryPartner` | `requestDeliveryPartner` |
| `updateInventory` | `updateInventory` |
| `toggleAvailability` | `toggleAvailability` |
| `reportIssue` | `reportIssue` |

> **Note:** Order **acceptance** is done directly via `FirestoreService.acceptOrder()` (Firestore write), NOT via cloud function. Order **rejection** goes via `FunctionsService.respondToOrder()`.

### Cloudinary Service (`src/services/cloudinary/cloudinary.ts`)
- Cloud name: `nffrbaq1` | API Key: `991948769391834`
- Signed upload using SHA1 HMAC with `crypto-js`
- Signature string: `timestamp=${timestamp}${API_SECRET}` → SHA1 hex
- Uses `XMLHttpRequest` (not `fetch`) to support upload progress callbacks
- Returns `secure_url` from Cloudinary response

### Order Alert Service (`src/services/alert/orderAlertService.ts`)
See full details in [Order Alert System](#order-alert-system) section.

---

## Custom Hooks

| Hook | File | Purpose |
|---|---|---|
| `useAuth` | `hooks/useAuth.ts` | Listens to Firebase auth state, loads store profile, saves push token |
| `useOrderQueue` | `hooks/useOrderQueue.ts` | Subscribes to active orders + history; triggers alert modal on NEW orders |
| `useAcceptOrder` | `hooks/useAcceptOrder.ts` | Wraps `FirestoreService.acceptOrder` with network check + loading state |
| `useRejectOrder` | `hooks/useRejectOrder.ts` | Wraps `FunctionsService.respondToOrder` with validation + network check |
| `useUpdateOrderStatus` | `hooks/useUpdateOrderStatus.ts` | Wraps `FirestoreService.updateOrderStatus` with network + error handling |
| `useRequestDeliveryPartner` | `hooks/useRequestDeliveryPartner.ts` | Sets order to `DELIVERY_REQUESTED`; mocks ETA as 8 min |
| `useKycUpload` | `hooks/useKycUpload.ts` | Uploads docs to Cloudinary, saves URLs to Firestore KYC subcollection |
| `useNetworkStatus` | `hooks/useNetworkStatus.ts` | Returns `{ isOnline: boolean }` |
| `useImageCompression` | `hooks/useImageCompression.ts` | Image compression utility for KYC uploads |

### Network-Gated Operations
All order mutation hooks (`useAcceptOrder`, `useRejectOrder`, `useUpdateOrderStatus`, `useRequestDeliveryPartner`) check `isOnline` before proceeding — they show an `Alert` and return `false` if offline.

---

## Order Alert System

### Architecture Overview
When a new order arrives (`status === NEW`), the system triggers a **multi-sensory alert**:
1. Full-screen modal (`FullScreenOrderAlertModal`) appears globally
2. Alert sound plays (`new_order_alert.mp3`) on loop via `expo-audio`
3. Device vibrates in a repeating pattern
4. Screen stays on via `expo-keep-awake`

### Flow
```
Firestore real-time update (customOrders or orders collection)
    ↓
useOrderQueue detects NEW order not in ignoredAlertOrders
    ↓
setActiveAlertOrder(newOrder) on useOrderStore
    ↓
RootNavigator sees activeAlertOrder != null
    ↓
FullScreenOrderAlertModal becomes visible
    ↓ (also triggers via startForegroundAlert)
OrderAlertService: plays sound + vibrates + keeps screen awake
```

### Expo Go Compatibility
- `expo-notifications` is **dynamically required** (not statically imported) to avoid crashes in Expo Go SDK 53+
- In Expo Go: notification channel init is skipped, mock push token returned
- Alert sound + vibration still work in Expo Go (uses expo-audio + Vibration API)

### OrderAlertService Methods
- `initializeNotificationChannel()` — sets up Android `high_importance_orders` channel
- `registerPushToken()` — requests permissions, returns Expo push token
- `startForegroundAlert(payload)` — plays sound, vibrates, keeps screen awake
- `stopAlert()` — stops sound, cancels vibration, deactivates keep-awake
- `onOrderAlert(callback)` — subscribe to alert events (returns unsubscribe fn)

### Alert Modal Actions
- **Accept** → calls `FirestoreService.acceptOrder()` → navigates to `OrderDetails` screen → adds orderId to `ignoredAlertOrders`
- **Reject/Ignore** → sets `activeAlertOrder(null)` → adds to `ignoredAlertOrders`

---

## KYC Flow

### KYC Status States
```
NOT_STARTED → (store submits docs) → PENDING_REVIEW → (admin reviews) → APPROVED
                                                                       → REJECTED → (re-upload) → PENDING_REVIEW
                                                                       → SUSPENDED_EXPIRED
```

### KYC Navigator (shown when KYC ≠ APPROVED)
- `KycStatusScreen` — shows current status + next steps
- `KycUploadWizardScreen` — multi-step wizard for uploading all docs
- `KycReuploadScreen` — re-upload specific rejected documents

### KYC Documents Required
| Doc Type | Validation | Notes |
|---|---|---|
| `DRUG_LICENSE` | License number, expiry date (must be future), image | Primary doc |
| `PAN` | Format: `ABCDE1234F` | 10-char regex |
| `AADHAAR` | Exactly 12 digits | |
| `GST` | 15-char GSTIN format (optional) | |
| `CANCELLED_CHEQUE` | Account no (9-18 digits), IFSC `SBIN0001234` | |
| `SHOP_PHOTO` | Image required | |
| `OWNER_PHOTO` | Image required | |
| `STORE_LOGO` | Optional | |

### KYC Upload Process (`useKycUpload`)
1. Pick image from device via `expo-image-picker`
2. Upload to Cloudinary via `CloudinaryService.uploadImage()` (gets `secure_url`)
3. Save to `stores/{storeId}/kyc/{docType}` with `status: 'PENDING_REVIEW'`
4. All docs submitted in parallel via `Promise.all()`

---

## Notifications Setup

### Android Channels
Two channels registered in `notifications.ts`:
1. **`default`** — standard notifications
2. **`order_alerts`** — high importance, custom sound `new_order_alert.mp3`, bypass DND

One channel registered in `orderAlertService.ts`:
3. **`high_importance_orders`** — `AndroidImportance.MAX`, vibration pattern, custom sound

### Push Token Flow
1. `useAuth` hook → calls `orderAlertService.registerPushToken()`
2. Token saved to `stores/{storeId}/expoPushToken` in Firestore
3. `RootNavigator` also attempts token update when `isAuthenticated` changes
4. EAS projectId: `f0743a69-78fb-4845-a338-99cac71b3f94`

---

## Theme & Design Tokens (`src/theme/tokens.ts`)

### Colors
```ts
colors.brand.primary       = '#006a47'  // emerald-deep
colors.brand.primaryLight  = '#82f9c0'
colors.action.accept       = '#10B981'  // emerald-lush
colors.action.reject       = '#ba1a1a'  // error red
colors.background.primary  = '#f2fcf4'  // surface-bright
colors.background.sageTop  = '#F4F7F5'  // tab bar bg
colors.text.primary        = '#151d19'
colors.text.muted          = '#6d7a71'
```

### Typography Scale
| Key | Size | Weight |
|---|---|---|
| `display` | 48 | 800 |
| `h1` | 32 | 700 |
| `h2` | 28 | 700 |
| `h3` | 20 | 600 |
| `body` | 16 | 400 |
| `bodyStrong` | 16 | 600 |
| `caption` | 12 | 600 |
| `button` | 18 | 400 |

### Spacing Scale
`xs=4`, `sm=8`, `md=12`, `lg=16`, `xl=20`, `xxl=24`, `xxxl=32`, `huge=64`

### Component Defaults
- Button primary min-height: `56` | Border radius: `14`
- Card border radius: `24` | padding: `24`
- Shadows: `sm` (elevation 2), `md` (elevation 4, green-tinted), `lg` (elevation 8, green-tinted)

---

## Validation Schemas (`src/utils/schemas.ts`)

All schemas use **Zod**:

| Schema | Used For |
|---|---|
| `StoreRegistrationSchema` | New store registration form |
| `RespondToOrderInputSchema` | Accept/Reject order payload (with cross-field refinements) |
| `KycDrugLicenseSchema` | Drug license form |
| `KycPanSchema` | PAN card form |
| `KycAadhaarSchema` | Aadhaar form |
| `KycGstSchema` | GST form (optional) |
| `KycBankDetailsSchema` | Bank account + cancelled cheque |

### Important Zod Refinements
- `RespondToOrderInputSchema`: Rejection requires `rejectionReason`. If reason is `OTHER`, `rejectionNote` must be ≥ 5 chars.
- `KycDrugLicenseSchema`: `expiryDate` must be a **future** date.

---

## App Constants (`src/constants/config.ts`)

```ts
APP_CONFIG = {
  appName: 'RapidMedico Store',
  bundleId: 'com.rapidmedi.store',
  deepLinkScheme: 'rapidmedi-store://',
  firebaseProjectId: 'rapidmedi',

  responseWindowSeconds: 90,     // Time window to respond to a new order
  otpLength: 6,
  otpResendCooldownSeconds: 30,
  maxOtpAttempts: 5,

  imageMaxDimensionPx: 1600,
  kycImageMaxDimensionPx: 2000,
  imageMaxFileSizeMb: 10,
  expiryReminderDays: [30, 14, 7, 1],

  storageKycPath: (storeId, filename) => `kyc/${storeId}/${filename}`,
}
```

Rejection reason labels and KYC doc labels are also exported from this file.

---

## EAS / Build Config

### `eas.json` Profiles
- `development` — development build
- `preview` — internal distribution
- `production` — production store build

### Android Package: `com.rapidmedi.store`
### iOS Bundle ID: `com.rapidmedi.store`
### Expo Slug: `rapidmedi-store`
### EAS Project ID: `f0743a69-78fb-4845-a338-99cac71b3f94`
### Expo Owner: `arunkumar628`

### Android Permissions Required
`CAMERA`, `READ/WRITE_EXTERNAL_STORAGE`, `NOTIFICATIONS`, `VIBRATE`, `WAKE_LOCK`,
`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `RECORD_AUDIO`,
`MODIFY_AUDIO_SETTINGS`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`

---

## Known Patterns & Gotchas

### 1. Dual Collection Order Reads
Orders exist in both `customOrders` AND `orders` Firestore collections. `subscribeActiveOrders` reads both and merges them. Always pass `_collection` (from `StoreOrder._collection`) when writing back to Firestore.

### 2. Dual Status Fields
Every Firestore order document has TWO status fields:
- `status` — shown to customer app (string like `'confirmed'`, `'delivery boy assigned'`)
- `storeStatus` — shown to store app (`OrderStatus` enum string)

When updating, always write BOTH fields.

### 3. OTP Fields Are Duplicated
The pickup/delivery OTP is stored in multiple fields (`storePickupOtp`, `pickupOtp`, `pickupPin`, `deliveryOtp`, `otp`) for cross-platform compatibility. Always read all of them as fallbacks.

### 4. `expo-notifications` Dynamic Import
**Never** statically import `expo-notifications` at the module level — it causes a crash in Expo Go SDK 53+. Always wrap in:
```ts
if (!isExpoGo) {
  Notifications = require('expo-notifications');
}
```

### 5. `ignoredAlertOrders` Prevents Re-Alerting
Once an order alert is dismissed (accepted or rejected), its ID is added to `ignoredAlertOrders` in `useOrderStore`. `useOrderQueue` checks this set before triggering `setActiveAlertOrder`. This list lives in memory only (cleared on app restart).

### 6. `storeId` Locked on Accept
When a store accepts an order, `FirestoreService.acceptOrder()` writes `storeId` to the order document. This "locks" the order to that store. The `subscribeActiveOrders` filter uses `_storeId === storeId` to filter orders relevant to the current store.

### 7. Bill Generation + Delivery Charge
`updateOrderBill()` always writes `deliveryCharge: 100` (hardcoded). Bill amount = sum of item prices (not including delivery). The `itemizedBill` array format: `{ medicine, qty, unitPrice, price }`.

### 8. `respondByAt` is Computed Client-Side
The `respondByAt` timestamp = `assignedAt + 90,000ms (90 seconds)`. It's computed in `mapDocToStoreOrder()`, not stored in Firestore.

### 9. Firebase Config in Both `app.json` and `config.ts`
Firebase credentials appear in `app.json` (under `extra`) AND are hardcoded as fallback defaults in `src/services/firebase/config.ts`. The config reads from `Constants.expoConfig?.extra` first, then falls back to hardcoded values.

### 10. Running the App
```bash
# Standard (LAN host)
npm start

# With cache clear
npm run start:clean

# Android
npm run android

# TypeScript check
npm run ts.check
```

---

## UI Components (`src/components/ui/`)

| Component | File | Purpose |
|---|---|---|
| `Button` | `Button.tsx` | Primary/secondary action button |
| `Badge` | `Badge.tsx` | Status badge (order status, KYC status) |
| `Card` | `Card.tsx` | Container card with standard styling |
| `Skeleton` | `Skeleton.tsx` | Loading skeleton placeholder |
| `AvailabilityToggle` | `AvailabilityToggle.tsx` | ONLINE/OFFLINE/HOLIDAY toggle |
| `DocumentUploadTile` | `DocumentUploadTile.tsx` | KYC document upload card |
| `FullScreenOrderAlertModal` | `FullScreenOrderAlertModal.tsx` | Full-screen modal for new order alerts (shown globally) |

---

## Feature Screens Reference

| Screen | Feature | Notes |
|---|---|---|
| `LoginScreen` | auth | Email + Phone OTP login |
| `OtpVerificationScreen` | auth | 6-digit OTP verification |
| `StoreRegistrationScreen` | auth | Largest screen (23KB); full store setup |
| `KycStatusScreen` | kyc | Shows KYC status + instructions |
| `KycUploadWizardScreen` | kyc | Multi-step doc upload wizard |
| `KycReuploadScreen` | kyc | Re-upload rejected docs |
| `DashboardScreen` | dashboard | Home screen with stats + quick actions |
| `OrdersScreen` | orders | Active + completed orders list |
| `OrderDetailsScreen` | orders | Largest operational screen (38KB); full order lifecycle management |
| `PrescriptionViewerModal` | orders | Shows prescription images in WebView |
| `RejectOrderBottomSheet` | orders | Rejection reason selector |
| `InventoryScreen` | inventory | Stock list with toggle |
| `AddMedicineScreen` | inventory | Add new medicine to stock |
| `EditMedicineScreen` | inventory | Edit existing medicine |
| `AnalyticsScreen` | analytics | Metrics dashboard (placeholder/stub) |
| `ProfileScreen` | profile | Store profile management |
| `StoreSettingsScreen` | profile | Settings |
| `WorkingHoursScreen` | profile | Set open/close times per day |
| `PerformanceDashboardScreen` | profile | Acceptance rate, ratings, etc. |
| `RatingsScreen` | profile | Customer ratings (stub) |
| `SupportScreen` | support | Contact support |
| `AnnouncementsScreen` | support | Platform announcements |

---

*This document covers the full scope of the `rapidmedico-store` codebase as of September 2026.*

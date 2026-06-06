# VendorBridge

VendorBridge is a modern React + Vite ERP‑style web application with a dark glassmorphism UI. It includes role‑based theming, authentication via localStorage, and a full set of supply‑chain pages.

---

## How to Run and Share VendorBridge

### Prerequisites
- **Node.js** (v20 or later) – ensure the `node` and `npm` executables are available in your PATH.
- **Git** (optional, for version control).

### Setup (local development)
```bash
# 1️⃣ Clone the repository (or copy the folder you received)
git clone <repo‑url>
cd vendor-bridge

# 2️⃣ Install dependencies
npm install

# 3️⃣ Start the development server
npm run dev
```
- The app will be served at `http://localhost:5173`.
- Login with any of the demo accounts (Admin, Procurement Officer, Vendor, Manager) using the **Quick‑Login** buttons on the login page.

### Build for Production
```bash
npm run build
```
- The compiled assets are placed in the `dist/` directory.
- The build is fully optimized: CSS is purged, code is minified, and source maps are omitted.

### Deploying to Vercel (public URL)
1. **Create a Vercel project** – import the repository or connect the local folder.
2. **Configure Build Settings**:
   - **Framework Preset**: `Other`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Add a `vercel.json`** (included in the repo) to ensure client‑side routing works:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
4. **Deploy** – Vercel will run the build command, upload the static files, and provide a public URL (e.g. `https://vendor‑bridge.vercel.app`).

### Production Routing
- The app uses **React Router v7**. The `vercel.json` rewrite rule sends any unknown path back to `index.html`, allowing the router to resolve routes client‑side.
- Ensure the `basename` in `BrowserRouter` (if you host under a sub‑path) matches the Vercel deployment path.

### LocalStorage Initialization
- On first load the app populates `vendor_bridge_user_profiles` and `vendor_bridge_user_passwords` in `localStorage` with the demo users and passwords.
- Subsequent visits read this data, keeping the user session persistent.

### Cleaning Development Artifacts
- All `console.log` statements have been removed.
- Debug messages are stripped from the production build.

### Ready for Hackathon Demo
- The app boots instantly, shows the dark glass‑styled UI, and works on any modern browser.
- Share the public Vercel URL with judges or teammates – no additional backend is required.

---

For more details, see the full `README.md` in the repository.

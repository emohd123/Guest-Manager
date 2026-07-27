# iTicket — Setting up the project on a new PC

Everything except secrets lives in GitHub. Follow in order.

## 1. Install the toolchain
- **Git** — git-scm.com
- **Node.js 22 LTS** — nodejs.org
- **Python 3.12+** (asset generation scripts) — python.org, then `pip install pillow`
- **Android Studio** (brings the Android SDK + the JBR Java runtime used for builds)
  - In Android Studio: SDK Manager → install Android SDK Platform 36 + Build-Tools + Platform-Tools (adb)
  - Optional: Device Manager → create an x86_64 emulator (any Pixel image) for testing

## 2. Get the code
```bash
git clone https://github.com/emohd123/Guest-Manager.git
cd Guest-Manager
```

## 3. Restore the secrets (from the transfer kit zip)
Copy from `iticket-transfer-kit.zip` into the repo root:
- `.env.local`  → repo root (Supabase URL/keys, app URL — the only real secret file)

Never commit this file. It is already in .gitignore.

## 4. Install dependencies
```bash
npm install            # web
cd mobile && npm install && cd ..
```

## 5. Run
```bash
npm run dev            # web on http://localhost:3000
cd mobile && npx expo start    # mobile (Metro)
```

## 6. Android builds (mobile/)
```bash
# Windows Git Bash — point JAVA_HOME at Android Studio's JBR:
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
cd mobile/android
./gradlew :app:assembleRelease     # APK at app/build/outputs/apk/release/
```
Notes:
- `mobile/android/local.properties` is machine-specific; Gradle regenerates it,
  or create it with: `sdk.dir=C:\\Users\\<YOU>\\AppData\\Local\\Android\\Sdk`
- The debug keystore is committed, so release builds sign identically on any PC
  (installs upgrade in place on devices).

## 7. Deploy access (optional on the new PC)
- Web deploys automatically on `git push` to main (Vercel).
- Supabase access: log into supabase.com with emohd123@gmail.com (project id
  zworeyksseoicmpthycv) — no local secret needed beyond `.env.local`.

## Quick sanity check
```bash
npx tsc --noEmit          # web typecheck
cd mobile && npx tsc --noEmit
curl http://localhost:3000/api/events/discover?limit=1   # after npm run dev
```

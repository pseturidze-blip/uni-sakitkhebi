# UNI Mixed-Use — საკითხები: setup guide

This guide takes about 20 minutes. You only need a web browser and a Google account.
You will:

1. Create a free Firebase project (the shared database and Google sign-in).
2. Paste its settings into `firebase-config.js`.
3. Publish the 5 files on GitHub Pages.
4. Add the e-mails of the people who may edit.
5. Import the existing 19 issues.

Files in this folder:

| File | What it is |
|---|---|
| `index.html` | The app. |
| `firebase-config.js` | The **only** file you edit (step 2). |
| `firestore.rules` | Security rules. You paste them into Firebase (step 4). |
| `uni-sakitkhebi-data.json` | The current 19 issues, for the one-time import (step 9). |
| `SETUP.md` | This guide. |

---

## Step 1 — Create the Firebase project

1. Open <https://console.firebase.google.com> and sign in with your Google account.
2. Click **Create a project** (or **Add project**).
3. Name it, for example `uni-sakitkhebi`. Click **Continue**.
4. Turn **Google Analytics** off (it is not needed). Click **Create project** and wait. Then click **Continue**.

The free "Spark" plan is enough. You do not need a credit card.

## Step 2 — Register the web app and copy its settings

1. On the project's start page, click the **`</>`** (Web) icon, labelled "Add app" → Web.
2. App nickname: `uni-sakitkhebi`. Leave "Firebase Hosting" **unticked**. Click **Register app**.
3. Firebase shows a code block containing `const firebaseConfig = { apiKey: "...", authDomain: "...", ... }`.
4. Open `firebase-config.js` in a text editor (Notepad is fine). Replace each `PASTE_...` value with the matching value from Firebase. Keep the quotes and commas. Save the file.
5. Click **Continue to console**.

(If you need these values again later: ⚙ **Project settings** → **General** → scroll down to "Your apps" → **Config**.)

> These values are not passwords. Anyone can see them in a website's code. The data is protected by the security rules in step 4.

## Step 3 — Create the database

1. In the left menu: **Build → Firestore Database** → **Create database**.
2. Location: pick a European one, e.g. **eur3 (europe-west)**. This cannot be changed later. Click **Next**.
3. Choose **Start in production mode**. Click **Create**.

## Step 4 — Paste the security rules

1. In **Firestore Database**, open the **Rules** tab.
2. Delete everything in the editor.
3. Open `firestore.rules` in Notepad, copy **all** of it, and paste it into the editor.
4. Click **Publish**.

These rules are what actually protect the data. Only people on the editor list (step 7) can read or change anything, even if someone bypasses the app.

## Step 5 — Turn on Google sign-in

1. Left menu: **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → **Google** → switch **Enable** on.
3. Choose a "Project support email" (your own). Click **Save**.

## Step 6 — Publish on GitHub Pages

You already use GitHub Pages, so this is the usual routine:

1. On GitHub, click **New repository**, e.g. `uni-sakitkhebi`. It must be **Public** if your GitHub plan is free (Pages on private repos needs a paid plan). Public is safe here: the code is public, but the data is not.
2. In the new repository, click **Add file → Upload files**. Drag in `index.html`, `firebase-config.js`, `firestore.rules`, `SETUP.md`.
   - **Do not upload `uni-sakitkhebi-data.json`** to a public repository. Keep it on your computer for step 9.
3. Click **Commit changes**.
4. **Settings → Pages** → Source: **Deploy from a branch**, Branch: **main**, folder **/ (root)** → **Save**.
5. After 1–2 minutes the address appears at the top of that page, e.g. `https://YOUR-USERNAME.github.io/uni-sakitkhebi/`.

## Step 7 — Allow the GitHub Pages address to sign in

1. Firebase → **Authentication → Settings** tab → **Authorized domains** → **Add domain**.
2. Enter only the host name, without `https://` and without the path: `YOUR-USERNAME.github.io`
3. Click **Add**.

(Without this step, sign-in fails with `auth/unauthorized-domain`.)

## Step 8 — The editor list (who may use the app)

1. Firebase → **Firestore Database → Data** tab → **+ Start collection**.
2. Collection ID: `config` → **Next**.
3. Document ID: `editors` (type it; don't use "Auto-ID").
4. Field: `emails`. Type: **array**.
5. Add one element per person, type **string**, the Google e-mail **in lowercase**, e.g. `pikria.seturidze@arci.ge`.
6. Click **Save**.

**To add a person later:** open `config` → `editors` → hover over `emails` → **+ (Add field)** inside the array → type the e-mail → **Update**.
**To remove a person:** hover over their e-mail in the array → trash icon.
Changes take effect immediately. A person who is removed loses access on their next page load.

The e-mail must be the one they use to sign in with Google. Gmail and Google Workspace addresses (like `@arci.ge`) both work.

## Step 9 — Import the current 19 issues (once)

1. Open your GitHub Pages address and click **Google-ით შესვლა**. Sign in with an e-mail from the list.
2. The page shows "საკითხები ჯერ არ არის" and the **იმპორტი (JSON)** button.
3. Click it and choose `uni-sakitkhebi-data.json` from your computer.
4. "იმპორტირებულია 19 საკითხი" appears, along with the list.

The button only appears while the database is empty, so the import can't run twice by accident.

During import, "პოზიცია / შენიშვნა" and "შეჯამება" become one field, "შენიშვნა". Where both had text (№1 and №7), the summary is kept under the label "შეჯამება:". The original two values are also stored unchanged in each issue (field `legacy`, visible in the Firebase console).

---

## Everyday use

- **Open an issue:** click its row. Status, priority, people, sub-points and comments change with one click. **რედაქტირება** edits the title, topic, description and note.
- **Board (დაფა):** drag a card to another column to change its status. On a phone, press and hold the card for a moment, then drag it (or open the card and tap the status).
- **CSV:** the CSV button (on a phone it is in the round account menu, top right). The file opens correctly in Excel with Georgian text.
- **Light/dark mode:** the ◐ button cycles through auto → light → dark.
- Everyone sees changes live; there is no need to refresh.

## Troubleshooting

| What you see | Cause and fix |
|---|---|
| "Firebase-ის პარამეტრები არ არის ჩასმული" | `firebase-config.js` still contains `PASTE_...`. Do step 2, then upload the file to GitHub again. |
| "ამ ანგარიშს წვდომა არ აქვს" | The signed-in e-mail is not in `config/editors.emails`, or it's written with capital letters or a typo. Fix it in step 8. Then click "სხვა ანგარიშით შესვლა" and sign in again. |
| Sign-in error `auth/unauthorized-domain` | Do step 7. |
| Sign-in window doesn't open | The browser blocked the pop-up. Allow pop-ups for the site. |
| Everyone is refused, including you | The rules weren't published (step 4), or `config/editors` doesn't exist or is misspelled (step 8). |
| You changed `index.html` but the site looks old | GitHub Pages takes 1–2 minutes. Then reload with Ctrl+F5. |

## Good to know

- **Two people editing the same issue at the same moment:** status, priority, people and sub-points are saved per field. If two people change the *same* field within a second, the last change wins.
- **Backups:** use the CSV button from time to time, or set up a scheduled export in Google Cloud (optional).
- **Costs:** a team of this size stays well inside the free plan (50,000 reads and 20,000 writes per day).

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
| `media.js` | Image compression, storage and the full-screen viewer (used by `index.html`). |
| `firebase-config.js` | The **only** file you edit (step 2). |
| `firestore.rules` | Security rules. You paste them into Firebase (step 4), and again whenever this file changes. |
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

**To add or remove people later, use the app** (owner only: `p.seturidze@gmail.com`, set in `firestore.rules` → `isOwner` and in `index.html` → `OWNER`):
round account menu (top right) → **რედაქტორები**. The panel shows every entry exactly as stored, in quotes, and marks problems
(extra spaces or line breaks, invisible characters, capital letters, several e-mails on one line, duplicates).
**ყველას გასწორება** fixes them all at once. New e-mails are always saved trimmed and in lowercase.

**Refused sign-ins:** when someone not on the list signs in, the app shows their e-mail with a copy button and records the attempt
(`accessRequests`, readable only by the owner). They appear at the bottom of the same panel with a **დამატება** (add) button.

Editing the list directly in the Firebase console still works, but text pasted there can carry invisible spaces; check the panel afterwards.
Changes take effect immediately. A person who was refused must click **თავიდან ცდა** (try again) or reload the page.

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

Two tabs under the title: **issues** (default) and the **materials catalog**.

### Issues
- **Open an issue:** click its row. Status, priority, people, sub-points and comments change with one click. **რედაქტირება** edits the title, topic, description and note.
- **Sub-points** show under each row: open ones first, done ones greyed and struck through below them. The checkbox above the list hides them.
- **Decided issues** (status გადაწყვეტილია) move to a collapsed section at the bottom of the list. Nothing is deleted; set another status to bring an issue back.
- **Board (დაფა):** drag a card to another column to change its status. On a phone, press and hold the card for a moment, then drag it (or open the card and tap the status).
- Every save shows a short message at the bottom. A **red** message means it was not saved, with the reason in brackets.

### Options inside an issue (ვარიანტები)
- In an opened issue: **+ ვარიანტი** adds an option (e.g. a lift model or a lobby design) with type, note, supplier, price, images and links.
- State: under discussion / chosen / rejected. Only one option per issue can be chosen; the app records who chose it and when.
- **შედარება** shows 2–3 options side by side. The list row shows a small counter (green when one is chosen).

### Materials catalog (მასალების კატალოგი)
- Category → element (e.g. "ლობის იატაკი") → variants. The five starting categories are created automatically; add more from the element editor (last item of the category list).
- A variant has images, supplier, price + unit, characteristics, pros, cons, note and links. **არჩევა** marks it chosen (one per element; the others stay).
- Filters: the counts at the top (all / undecided / chosen), category, search.
- **Links to issues:** in an element, "+ საკითხი"; in an issue, "+ მასალა". Both sides show the link; click it to jump, and "←" to go back.

### Images and links
- Images are compressed in the browser (max 1600 px, under 1 MB) and stored in Firestore, so the free plan is enough. Roughly **2,500–4,000 images** fit in the free 1 GiB.
- Accepted: photos, renders and drawings as image files up to 15 MB. **PDFs and very large drawings: add a link** (e.g. Google Drive) instead. Drive links show a preview when the file is shared as "Anyone with the link".
- Removing an image, an option, a variant, an element or an issue also deletes its images.

### Other
- **CSV:** the CSV button on each tab (on a phone: in the round account menu, top right). Issues and catalog export separately; both open correctly in Excel with Georgian text.
- **Light/dark mode:** the ◐ button cycles through auto → light → dark.
- Everyone sees changes live; there is no need to refresh.

## Troubleshooting

| What you see | Cause and fix |
|---|---|
| "Firebase-ის პარამეტრები არ არის ჩასმული" | `firebase-config.js` still contains `PASTE_...`. Do step 2, then upload the file to GitHub again. |
| "ამ ანგარიშს წვდომა არ აქვს" | The screen shows the exact e-mail they signed in with. Open the editors panel (step 8): the attempt is listed at the bottom, and wrongly written entries are marked in red. Add or fix, then they click **თავიდან ცდა**. |
| "Firebase-ის წესები ძველია" (on the no-access screen or as a yellow bar) | The rules published on Firebase are older than `firestore.rules`. Paste the file again (step 4). |
| Sign-in error `auth/unauthorized-domain` | Do step 7. |
| Sign-in window doesn't open | The browser blocked the pop-up. Allow pop-ups for the site. |
| Everyone is refused, including you | The rules weren't published (step 4), or `config/editors` doesn't exist or is misspelled (step 8). |
| Red message "ვერ შეინახა: … (permission-denied)" | The rules on Firebase are older than `firestore.rules`, or your e-mail is not on the editor list. Paste the rules again (step 4) and check step 8. |
| Red message with `resource-exhausted` | A free daily limit or the 1 GiB storage is used up. Delete old images, or wait until the next day for daily limits. |
| Yellow bar at the top | The live connection to the database is interrupted. Check the internet connection and reload with Ctrl+F5. |
| You changed `index.html` but the site looks old | GitHub Pages takes 1–2 minutes. Then reload with Ctrl+F5. |

## Good to know

- **Two people editing the same issue at the same moment:** status, priority, people and sub-points are saved per field. If two people change the *same* field within a second, the last change wins.
- **Backups:** use the CSV button from time to time, or set up a scheduled export in Google Cloud (optional).
- **Costs:** a team of this size stays well inside the free plan (50,000 reads and 20,000 writes per day, 1 GiB stored).
- **How much space is used:** Firebase console → **Firestore Database → Usage**.
- **Where the data lives (for an administrator):** `issues`, `comments`, `meta` (issue numbers), `options` + `choices` (options inside issues), `catCategories`, `catElements`, `catVariants` + `catChoices` (catalog), `images` + `thumbs` (pictures), `config/editors` (who may edit).

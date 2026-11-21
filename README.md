# Madhur Ganga Minerals: Cooler Hisab App

Water cooler business ka roz ka hisab rakhne wala mobile app (PWA). Ye phone par app ki tarah install hota hai, bina internet ke bhi khulta hai, aur internet aate hi data Google account me sync kar deta hai.

## App me kya hai

| Tab | Kaam |
|---|---|
| **Entry** | Date chuno, labour chuno, phir 4 cheezein bharo: Cooler le gaye, Wapis aaye, Market me lage, Paisa mila. Neeche live parchi dikhti hai. Save karte hi agla labour apne aap aa jaata hai. |
| **Roz** | Kisi bhi din ka sab labour ka hisab, din ka total, "entry nahi hui" tag, aur WhatsApp parchi |
| **Mahina** | Mahina ya saal ki table. Cooler baaki aur paisa baaki hamesha shuru se us period ke aakhir tak ka hota hai. |
| **Report** | Din, Mahina, Saal ya Labour ki report. PDF, Word aur Excel me download. PDF me Hindi naam bhi sahi dikhte hain. |
| **Kharcha** | Company ke kharche: Diesel, Gaadi service/repair, Salary, Driver ka paisa, Plant/machine, Bijli bill, Kiraya, Anya, aur apni nayi category bhi bana sakte hain. Har kharche me date, rakam, kisko diya aur note. Mahina/Saal/Poora ka category-wise total, aur **Bachat = labour se mila − kharcha**. PDF/Word/Excel report bhi. |
| **Labour** | Labour jodna, naam/phone badalna, list se hatana, har labour ka khata, aur "WhatsApp pe hisab bhejein" button. ⚙️ **Settings** me: **bhasha (Hinglish / English / हिंदी)**, rate, backup, restore/purana data, logout. |

**Bhasha:** Login screen par ya Settings me Hinglish, English ya हिंदी chunein. Poora app, WhatsApp message aur PDF/Word/Excel reports usi bhasha me bante hain. Ye choice har phone par alag yaad rehti hai. Labour ke naam bhi usi likhawat me dikhte hain (हिंदी me नसीम, English me Naseem). App khud badalta hai; spelling galat ho to labour ke form me "Naam Hindi me / English me" likh dein.

### Kaun kya kar sakta hai (login aur permission)
Saare log ek hi company ka data dekhte hain. Koi bhi Google se login kar sakta hai, lekin **malik ki approval ke bina kuch nahi dikhta**.

| Role | Kya kar sakta hai |
|---|---|
| **Malik** | Sab kuch: entry/kharcha/labour badalna aur delete, rate, backup restore, logon ko approve/hatana |
| **Manager** | Sab dekh sakta hai; **nayi** entry, naya labour, naya kharcha save kar sakta hai. Badal/delete nahi. |
| **Labour** | Sirf Entry screen: **nayi** entry save kar sakta hai. Kharcha, reports, labour list nahi. |
| **Naya user** | "Malik ki approval ka intezaar" screen. Malik **Labour → ⚙️ Settings → Team** me Manager/Labour banata hai ya Mana karta hai. |

Ye rok sirf app ke buttons me nahi, **Firebase server ke rules (`firestore.rules`) me bhi hai**, isliye koi chalaaki se bhi purani entry nahi badal sakta.
Malik ka account Firestore me `members/{uid}` (role `owner`) se tay hota hai.

### Hisab ke formula
- Paisa bane = Lage × Rate (us din ka rate entry ke saath save hota hai; rate badalne se purani entry nahi badalti)
- Cooler baaki = Pichla (opening) cooler + Σ(Le gaye − Wapis aaye)
- Paisa baaki = Pichla (opening) paisa + Σ(Paisa bane − Paisa mila)
- **Pichla baaki (opening balance):** kisi labour ke liye "is date ke ant tak itne cooler aur itna paisa baaki tha" daal sakte hain. Us date ke baad ka hisab usi se aage chalta hai.

---

## Live karne ke steps (simple bhasha me)

### Step 1: Firebase project banayein (5 minute, free)
1. Computer ya phone me **https://console.firebase.google.com** kholein aur apne Google account se login karein.
2. **"Create a project"** (ya "Add project") dabayein. Naam likhein, jaise `madhur-ganga`, aur aage badhein. Google Analytics ki zaroorat nahi, use **off** kar dein.
3. **Google login chalu karein:** baayein menu me *Build → Authentication → Get started → Sign-in method → Google* → **Enable** karein, support email chunein → **Save**.
4. **Database banayein:** *Build → Firestore Database → Create database* → location me **asia-south1 (Mumbai)** chunein → **Production mode** → Create.
5. **Web app jodein:** upar ⚙️ *Project settings* → neeche *Your apps* me **`</>`** (Web) icon → nickname `cooler-app` → **Register app**.
6. Wahan ek `firebaseConfig = { apiKey: ..., authDomain: ..., projectId: ... }` dikhega. **Ye poora block copy karke mujhe (Claude ko) bhej dein.** Ye secret nahi hota, isse koi aapka data nahi padh sakta. Data ki suraksha `firestore.rules` se hoti hai: har user sirf apna data dekh sakta hai.

### Step 2: Deploy (website live karna)
Ye kaam Claude kar sakta hai:
1. Aap `firebaseConfig` bhejte hain, Claude use `src/firebase-config.js` me daal deta hai.
2. Claude `firebase login` chalata hai aur aapko ek link deta hai. Aap link kholkar usi Google account se login karte hain aur jo code milta hai woh Claude ko bhej dete hain.
3. Claude `npm run deploy` chalata hai. App **https://&lt;project-id&gt;.web.app** par live ho jaata hai.

Khud apne computer se karna ho (Node.js 20+ chahiye):
```bash
npm install
npx firebase login
npx firebase use --add        # apna project chunein
npm run deploy
```

### Step 3: Phone par install karein
- **Android (Chrome):** `https://<project-id>.web.app` kholein → upar ⋮ menu → **"Add to Home screen"** ya **"Install app"** → Install. Ab home screen par **MGM Hisab** ka icon aa jayega.
- **iPhone (Safari):** link kholein → neeche **Share** (⬆️) → **"Add to Home Screen"** → Add.
- Pehli baar internet ke saath kholkar **"Google se login"** karein. Uske baad app bina internet ke bhi khulega.

### Step 4: Purana data laayein
**Labour → ⚙️ Settings → "Backup / purane app ka data laayein"** → purane app ki JSON file chunein. App pehle dikhata hai ki kitne labour aur kitni entries aayengi. **"Haan, data daalein"** dabane par data aa jaata hai. Agar same labour aur same date ki entry pehle se ho, to file wali entry rakhi jaati hai.

### Roz ki aadat
- Hafte me ek baar **Settings → Backup download** karke file WhatsApp ya Drive par rakh lein.
- Ooper ka pill batata hai: **✓ Sync** (sab server par hai), **⟳ Sync…** (bhej raha hai), **● Offline** (data phone me safe hai, net aate hi chala jayega).
- Offline me logout na karein, warna jo data abhi sync nahi hua woh kho sakta hai.

---

## Developer notes
- React + Vite, `vite-plugin-pwa` (offline cache), Firebase Auth (Google) + Firestore (offline persistence).
- Data (poori company ka saanjha): `members/{uid}` (role), `biz/main/labours/{id}`, `biz/main/meta/settings` (rate, `xcats`), `biz/main/months/{YYYY-MM}` (entries), `biz/main/xmonths/{YYYY-MM}` (kharche). Purane version ka `users/{uid}/...` data sirf padhne ke liye rakha hai. Ek mahine ki saari entries ek document me map ki tarah rehti hain, taaki reads kam lagein aur free plan me aaraam se chale.
- `npm test`: hisab, kharcha, backup/import, report files (PDF/Word/Excel) aur teeno bhasha ke unit tests.
- Bhasha ke saare words `src/i18n/strings.js` me hain: `[Hinglish, English, हिंदी]`.
- `npm run dev`, phir `/?demo=1` kholein: bina Firebase ke demo mode (data browser me).
- PDF: `pdf-lib` + `@pdf-lib/fontkit`, Noto Sans Devanagari aur Noto Sans (Latin subset) font embed hote hain (`public/fonts`, SIL Open Font License).

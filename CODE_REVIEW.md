# Code review — client-ui (2026-08-05)

> Primul review pe acest repo. Context: e ultimul serviciu nemigrat (pasul **C** din planul de migrare). Branch curent: `feat/keycloak-vite` (și branch-ul default al repo-ului), ultimul commit `58f0537` din 2025-11-28.
> Review-ul e orientat spre întrebarea „ce trebuie reparat **înainte** de a-l pune în cluster", nu spre stil React.

## Sumar

| # | Sev | Fișier | Problemă |
|---|---|---|---|
| U1 | 🔴 | `components/auth/KeycloakService.ts:60-70` | credențiale de admin Keycloak (`admin`/`admin`) în codul livrat în browser |
| U2 | 🔴 | `Dockerfile:13-33` | imaginea rulează serverul de **dezvoltare** Vite, nu un build |
| U3 | 🔴 | `KeycloakService.ts:66,80,110` | template literals cu ghilimele în loc de backticks → `registerUser` și `logout` sunt rupte |
| U4 | 🟡 | `utile/utile.tsx:12-19` | config citit din `import.meta.env` = înghețat la build → nu poți configura imaginea per mediu |
| U5 | 🟡 | `KeycloakService.ts:29-55` | login prin password grant în loc de authorization code + PKCE |
| U6 | 🟡 | `KeycloakService.ts:49`, `Api.tsx:49` | token în `localStorage` și în `console.log` |
| U7 | 🟡 | realm `rsk` (ms-gitops) | `react-client` are redirectUris doar pe `localhost` → login rupt la primul deploy |
| U8 | 🟡 | `components/auth/` | 3 copii ale aceluiași serviciu Keycloak, 2 `useConfig`, 2 `loadConfig` |
| U9 | 🟢 | `Api.tsx:39` | `Access-Control-Allow-Origin` trimis ca header de **cerere** |
| U10 | 🟢 | `.env`, `.idea/`, `package-old.json`, `files-docker/`, `migrate-to-vite.js` | resturi comise în git |
| U11 | 🟢 | `.github/workflows/deploy.yml:21` | tag din dată — celelalte două servicii au trecut deja pe SHA |

---

## 🔴 U1 — Parola de admin Keycloak, livrată fiecărui vizitator

`src/components/auth/KeycloakService.ts:60-70`
```ts
const adminParams = new URLSearchParams();
adminParams.append("client_id", "admin-cli");
adminParams.append("grant_type", "password");
adminParams.append("username", "admin");
adminParams.append("password", "admin");   // pune parola reală de admin
```
apoi, cu token-ul obținut, `:80` creează useri prin `/admin/realms/rsk/users`.

Tot ce e în `src/` ajunge în bundle-ul JavaScript pe care browserul îl descarcă. Nu există „doar pentru backend" într-un SPA: orice string din cod e vizibil cu Ctrl+U sau în tab-ul Sources. Comentariul „pune parola reală de admin" descrie exact ce nu trebuie făcut niciodată — dacă acolo ar fi ajuns parola reală, oricine deschide site-ul ar fi avut control total pe Keycloak: toți userii, toate realm-urile, toți clienții.

Azi te salvează două accidente: parola din cluster nu e `admin` (e generată în `keycloak-initial-admin`), iar apelul e oricum rupt de U3. Ambele sunt noroc, nu design.

**Mecanismul de dedesubt:** crearea de utilizatori e o operație **privilegiată**. Un client public (SPA) nu poate ține niciodată un credențial privilegiat, pentru că nu are unde să-l ascundă — nu are „server side". Operațiile privilegiate se fac pe un serviciu de backend, care primește token-ul utilizatorului, verifică rolul, și abia apoi apelează Keycloak cu identitatea **lui**. În realm-ul din `ms-gitops` există deja clientul `registration-service` — exact pentru asta.

**Fix:** scoate `registerUser` din UI. Front-end-ul cheamă un endpoint din backend (`POST /api/v1/users`), iar backend-ul vorbește cu Keycloak folosind service account-ul lui. Dacă înregistrarea de useri nu e o cerință a demo-ului, șterge funcția — e cea mai ieftină reparație.

---

## 🔴 U2 — Imaginea de producție rulează serverul de development

`Dockerfile:13-33`
```dockerfile
FROM node:22-alpine3.21
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]
```

`npm run dev` pornește Vite în modul development: compilează la cerere, servește module ES netranspilate, ține HMR-ul deschis pe un WebSocket, expune codul sursă complet cu source maps, și ține în container tot `node_modules` (~400MB) plus sursele. `--host` îl leagă pe `0.0.0.0`, deci e chiar expus.

Nu e „mai lent, dar merge": e alt program. Serverul de dev nu e gândit pentru concurență, nu are cache-uri de producție, iar Vite documentează explicit că nu trebuie expus. Comparat cu ce ai deja la data-service și importer-service — build reproductibil, artefact imutabil, imagine minimală — UI-ul e la un standard complet diferit în același cluster.

**Fix (multi-stage, exact ca la celelalte servicii):**
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build                      # produce /app/dist (Vite, nu /app/build)

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY config/nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Atenție la `nginx.conf:3` — `root /app/build;` e din era Create React App. Vite scrie în `dist`, iar în imaginea de mai sus conținutul ajunge în `/usr/share/nginx/html`. `try_files $uri $uri/ /index.html;` e corect și rămâne (fără el, un refresh pe `/products` dă 404 — SPA-ul are rutele doar în JS).

---

## 🔴 U3 — Trei URL-uri care nu se interpolează niciodată

`src/components/auth/KeycloakService.ts:66`
```ts
const adminTokenResp = await fetch("${import.meta.env.VITE_KEYCLOAK_URL}/realms/master/protocol/openid-connect/token", {
```
La fel la `:80` și `:110`. Ghilimele **duble**, nu backticks — deci nu e template literal, e un string obișnuit. Browserul cere literalmente calea `/${import.meta.env.VITE_KEYCLOAK_URL}/realms/master/...` relativ la origine, și primește 404.

Consecințe concrete:
- `registerUser` — nu a funcționat niciodată
- `logout` (`:110`) — șterge token-ul local, apoi redirecționează către un URL invalid. Utilizatorul crede că a ieșit, dar **sesiunea din Keycloak rămâne activă**: următorul `check-sso` îl reautentifică tăcut. Din perspectiva lui, butonul de logout nu face nimic.

Linia `:37` din același fișier folosește backticks corect — deci știi construcția; sunt trei scăpări de tastare care n-au fost prinse pentru că nimic nu le testează. Un `npm run build` cu `tsc` strict nu le prinde nici el (ambele sunt `string` valid) — dar un singur test pe `logout` le-ar fi prins pe toate.

---

## Before / After (critice)

| # | Acum | Cum ar trebui |
|---|---|---|
| U1 | `adminParams.append("username", "admin");`<br>`adminParams.append("password", "admin");`<br>`fetch(".../realms/master/.../token")` | funcția dispare din UI;<br>`fetch(`${apiUrl}/api/v1/users`, { method: "POST", body })`<br>backend-ul (client `registration-service`) vorbește cu Keycloak |
| U2 | `CMD ["npm", "run", "dev", "--", "--host"]` | `RUN npm run build` într-un stage de build<br>+ `FROM nginx:1.27-alpine` cu `dist/` copiat |
| U3 | `fetch("${import.meta.env.VITE_KEYCLOAK_URL}/realms/...")` | `` fetch(`${import.meta.env.VITE_KEYCLOAK_URL}/realms/...`) ``<br>(backticks, în toate cele 3 locuri: `:66`, `:80`, `:110`) |

---

## 🟡 Importante — ce blochează migrarea în cluster

**U4 — configul e înghețat în bundle la build.**
`src/utile/utile.tsx:12-19` și `KeycloakService.ts:7` citesc `import.meta.env.VITE_*`. Vite **înlocuiește textual** aceste expresii cu valorile din `.env` în momentul build-ului. Rezultat: imaginea produsă acum conține hardcodat `http://localhost:5000` și `http://localhost:8085` — și nicio variabilă de mediu din `values.yaml` nu le mai poate schimba.

Asta e diferența fundamentală față de data-service și importer-service: acolo, configul se citește la **pornirea procesului**, deci aceeași imagine merge în orice mediu. Aici, o imagine = un mediu. Dacă păstrezi pattern-ul, ai nevoie de câte un build per mediu, ceea ce anulează ideea de artefact imutabil promovat între medii.

Ai deja jumătate din soluția corectă în repo: `config/useConfig.ts:8` face `fetch('/config.json')` — citire la **runtime**, exact ce trebuie. Doar că nimeni nu-l folosește: în `App.tsx:2` și `Api.tsx:53` e comentat, iar `Api.tsx:59` cheamă `loadConfig()` din `utile.tsx`, adică varianta cu `import.meta.env`.

**Direcția pentru pasul C:** `Api.tsx` și `KeycloakService.ts` citesc dintr-un obiect încărcat la pornire din `/config.json`; fișierul e montat în pod dintr-un ConfigMap (`business/rsk/client-ui/`), cu URL-urile reale (`https://data-service.icode.mywire.org`, `https://auth.icode.mywire.org`). Aceeași imagine, orice mediu — și un `kubectl rollout restart` schimbă configul fără rebuild.

**U5 — login prin password grant.**
`KeycloakService.ts:29-55` trimite username + parola direct din SPA către endpoint-ul de token. Parola trece prin JavaScript-ul aplicației, deci aplicația o „vede" — exact ce evită OAuth: utilizatorul introduce parola **doar** pe pagina Keycloak. În plus, password grant nu suportă MFA și e scos din OAuth 2.1.

Detaliu care spune ceva bun despre restul muncii tale: în realm-ul din `ms-gitops`, **toți** clienții au `directAccessGrantsEnabled: false` — mai puțin `react-client` (`rsk.yaml:32`), care îl are `true` special pentru acest cod. Ai aplicat deja principiul corect peste tot; a rămas o singură excepție, ținută în viață de UI. Ai deja `keycloak.init({ onLoad: "check-sso" })` la `:17` și `pkce.code.challenge.method: S256` în realm — infrastructura pentru fluxul corect (`keycloak.login()`) e pusă, mai trebuie doar folosită.

**U6 — token în `localStorage` + token în consolă.**
`KeycloakService.ts:49` — `localStorage.setItem("kc_token", ...)`: orice XSS (o dependență compromisă e suficientă) citește token-ul și îl trimite oriunde. `keycloak-js` ține token-ul în memorie și îl reîmprospătează singur — de asta nu are nevoie de `localStorage`. Iar `Api.tsx:49` — `console.log("Token=" + token)` — scrie access token-ul în consola browserului la fiecare cerere; pe un calculator partajat sau într-un screenshot de suport, e un credențial valabil dăruit.

**U7 — realm-ul nu cunoaște host-ul de producție.**
`ms-gitops/business/rsk/keycloak/realm/rsk.yaml:33-36` — `react-client` are redirectUris doar `http://localhost:5174/*`, `:5000/*`, `:3000/*`. În clipa în care UI-ul rulează pe `https://client.icode.mywire.org`, Keycloak refuză login-ul cu `Invalid parameter: redirect_uri`. La fel, `logout` (`KeycloakService.ts:110`) trimite către `http://localhost:5000/ui`. De adăugat în realm **înainte** de primul deploy, altfel primul lucru pe care-l vezi în cluster e o eroare de login care pare de cod.

**U8 — trei variante ale aceluiași fișier, nicio indicație care e cea bună.**
`components/auth/KeycloakService.ts`, `KeycloakServices.ts`, `KeycloakServicex.ts` — trei implementări diferite ale autentificării, două stocând `authState`, una `kc_token`. La fel: `config/useConfig.ts` și `src/config/useConfig.ts` (variante diferite), `src/utile/utile.tsx` și `src/config/configLoader.ts` (ambele exportă `loadConfig`). Plus `package-old.json`, `nginx.conf` și `config/nginx/nnginx.conf`, `files-docker/`, `migrate-to-vite.js`.

Nu e doar dezordine: la migrare, prima întrebare e „ce citește configul?", iar repo-ul dă patru răspunsuri diferite, dintre care trei sunt moarte. Înainte de pasul C, păstrează exact un fișier pe rol și șterge restul — git-ul ține istoria, nu trebuie să o ții tu în `src/`.

---

## 🟢 Cleanups

- **U9** — `src/Api.tsx:39`: `"Access-Control-Allow-Origin": "*"` pus în headerele **cererii**. E un header de răspuns, pe care îl trimite serverul. Pus pe cerere, singurul lui efect e că transformă cererea în una „non-simple", deci browserul obligă un preflight `OPTIONS`, iar serverul trebuie acum să accepte explicit acest header — adică ai creat chiar problema pe care încercai s-o eviți. Scoate-l; CORS se rezolvă exclusiv pe server (unde `data-service` are deja `app.cors.allowed-origins`).
- **U10** — comise în git: `.env` (valorile de build), `.idea/` (4 fișiere), `package-old.json`, `migrate-to-vite.js`, `files-docker/`, `build_push_version.bat`, `service_version_number.bat`, `public/config.development.json` + `config.production.json` (ultimul cu un IP de AWS mort: `34.247.255.42`). Un `.gitignore` cu `.env`, `.idea/`, `dist/` și o curățare într-un singur commit.
- **U11** — `.github/workflows/deploy.yml:21`: `BUILD_NUMBER=$(date '+%d.%m.%Y.%H.%M.%S')`. Ai trecut deja data-service și importer-service pe tag = SHA scurt, cu job de `cd-bump` care actualizează `values.yaml` în `ms-gitops`. Copiază `ci.yml` de la importer-service și schimbă `IMAGE` și `VALUES` — e literal singura diferență. Bonus: `actions/checkout@v2` și `docker/login-action@v1` sunt versiuni vechi față de `@v4`/`@v3` din celelalte două.
- **U12** — branch-ul default al repo-ului e `feat/keycloak-vite`, cu `master`, `feat/kafka` și `fix/keycloak` divergente în urmă. Înainte de migrare, decide care e trunchiul și fă merge — altfel `values.yaml` din gitops va referi o imagine construită dintr-un branch de feature.

---

## Ordinea de atacat (pasul C)

1. **U1 + U3** — scoate `registerUser`, repară backtick-urile (5 minute, elimină cel mai grav risc)
2. **U8** — un singur `KeycloakService`, un singur loader de config
3. **U4** — mută pe `/config.json` la runtime (deblochează „o imagine, orice mediu")
4. **U2** — Dockerfile multi-stage cu nginx
5. **U11** — CI copiat de la importer-service (SHA + `cd-bump`)
6. **U7** — redirectUris reale în realm, în `ms-gitops`
7. **U5 + U6** — `keycloak.login()` cu code+PKCE, token doar în memorie; apoi `directAccessGrantsEnabled: false` și pe `react-client`

---

## Q&A

**Q1.** `import.meta.env.VITE_APP_API_URL` și `fetch('/config.json')` par să facă același lucru — dau UI-ului adresa API-ului. Ce se întâmplă cu fiecare în momentul `npm run build`, și de ce doar unul dintre ele îți permite să folosești aceeași imagine Docker în două medii diferite?

**Q2.** Ai scris în cod credențialele de admin Keycloak cu comentariul „de obicei folosit doar în backend, dar pentru demo îl punem aici". Într-un SPA, unde anume ar fi putut fi ascunse ca să nu ajungă la utilizator? Ce face un backend diferit în privința asta?

**Q3.** `logout` șterge `kc_token` din `localStorage` și redirecționează. Presupunând că URL-ul ar fi fost corect (U3), ce s-ar întâmpla dacă ai șterge **doar** token-ul local, fără să treci pe la endpoint-ul de logout al Keycloak-ului? De ce contează, având în vedere `onLoad: "check-sso"` de la `:18`?

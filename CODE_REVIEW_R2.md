# Code review — client-ui, runda 2 (2026-08-26)

> Branch revizuit: **`master`** (`a9e85ca`, 2026-04-15) — trunchiul pe care lucrezi, nu `feat/keycloak-vite`.
> Runda 1 (2026-08-05) s-a uitat la `feat/keycloak-vite`. O parte din ce ceream acolo e deja rezolvat pe `master` — vezi mai jos.
> Verificat **prin rulare**: `npm install --legacy-peer-deps` + `npm run build` pe `master`, apoi inspectat artefactul din `dist/ui/`. Concluziile de mai jos nu sunt citite din cod, sunt scoase din bundle.

---

## Ce s-a închis între runde (pe `master`)

Astea nu mai sunt probleme, și merită spus explicit pentru că sunt exact lucrurile grele:

| Runda 1 | Stare pe `master` |
|---|---|
| **U1** — `admin`/`admin` Keycloak în bundle | ✅ dispărut din calea vie. `MyKeycloakService` nu mai are cod de admin |
| **U3** — ghilimele în loc de backticks (3 locuri) | ✅ nu există în `MyKeycloakService` |
| **U5** — login prin password grant | ✅ **rezolvat corect**: `keycloak.login()` cu `pkceMethod: "S256"`, authorization code flow |
| Register scris de mână prin Admin API | ✅ trecut pe `keycloak.login({ action: 'register' })` |

`MyKeycloakService.ts` e cea mai bună bucată de cod din repo. Ai și rezolvat elegant două capcane clasice: `initPromise` pentru „can only be initialized once" (`:30`) și `checkLoginIframe: false` (`:38`). Restul review-ului e despre ce te oprește să pui asta în cluster.

---

## Sumar

| # | Sev | Fișier | Problemă |
|---|---|---|---|
| C1 | 🔴 | `.env:3`, `src/vite-env.d.ts:3`, `public/config/config.json:4` | client secret real, comis în repo **public**, în 3 locuri — și **livrat** în imagine la `/ui/config/config.json` |
| C2 | 🔴 | `.env:1-2` → bundle | URL-urile sunt **coapte** în JS: `http://api.react-app.local`, `http://auth.react-app.local`. În cluster, UI-ul cheamă un host inexistent |
| C3 | 🔴 | `Dockerfile:23` | imaginea rulează `npm run dev` — serverul de development, nu un build |
| C4 | 🔴 | `Home/index.tsx:67`, `Register/index.tsx:11` | **două** instanțe Keycloak în aceeași aplicație; `KeycloakServicex` aruncă la import dacă lipsește `.env` |
| C5 | 🔴 | `argo-ms-gitops` — CI/GitOps | lanțul CI→GitOps scrie în repo-ul **greșit**; nu există nimic pentru client-ui în niciunul |
| C6 | 🟡 | realm `rsk.yaml:33-36` | `react-client` are redirectUris doar pe `localhost` → login rupt la primul deploy |
| C7 | 🟡 | `data-service.icode.mywire.org` | e în spatele oauth2-proxy pe **cookie**; un `fetch` cu Bearer primește 302, nu 200 |
| C8 | 🟡 | `data-service/values.yaml` | `APP_CORS_ALLOWED_ORIGINS` nesetat → default `http://client,...` → browserul blochează UI-ul |
| C9 | 🟡 | `MyKeycloakService.ts:50`, `Api.tsx:50`, `:90` | token în `localStorage` + token scris în consolă la fiecare cerere |
| C10 | 🟡 | `.github/workflows/deploy.yml` | tag din dată, acțiuni v1/v2, fără build, fără `cd-bump`, imagine cu alt nume decât în plan |
| C11 | 🟢 | `index.html:9-10` | `./bootstrap.css` nu există → Vite avertizează la build, 404 în producție |
| C12 | 🟢 | `nginx.conf`, `config/nginx/nginx.conf` | `root /app/build` — din era CRA; Vite scrie în `dist/ui` |
| C13 | 🟢 | `src/vite-env.d.ts:1-3` | nu e TypeScript valid; nu se vede pentru că nu există `tsc` nicăieri |
| C14 | 🟢 | repo | 4 implementări de `KeycloakService*`, `.idea/`, `package-old.json`, `craco.config.js`, `files-docker/`, IP AWS mort |

---

## 🔴 C1 — Un client secret, comis în repo public, în trei locuri, și livrat în imagine

`.env:3`
```
VITE_KEYCLOAK_SECRET=Gyu02seUdOEgZ2hpjeeXx4O9vDg9PwW6
```
`src/vite-env.d.ts:3` — aceeași valoare.
`public/config/config.json:4` — aceeași valoare.

Și nu rămâne în repo. Am rulat build-ul și am căutat șirul în artefact:

```
$ grep -rl "Gyu02seUdOEgZ2hpjeeXx4O9vDg9PwW6" dist/
dist/ui/config/config.json
```

Tot ce e în `public/` e copiat ca atare în `dist/`. Deci după deploy, oricine deschide `https://<host>/ui/config/config.json` primește secretul. Nu trebuie nici măcar Ctrl+U — e un fișier servit direct de nginx, la o adresă ghicibilă.

**Mecanismul de dedesubt:** `public/` nu e „folder de configurare", e **rădăcina site-ului static**. Vite nu procesează nimic de acolo — nu bundluiește, nu minifică, nu filtrează. Ce pui în `public/x.json` devine `https://site/x.json`. Un secret pus acolo nu e „mai ascuns" decât unul pus în cod; e mai expus, pentru că e și lizibil fără efort.

Al doilea strat: repo-ul e **public** pe GitHub. Secretul e în istoric din momentul primului commit care l-a adus. Chiar dacă îl ștergi acum din fișiere, rămâne în `git log`. Ștergerea din working tree nu e o reparație pentru un credențial scurs.

**Fix, în ordinea asta:**
1. **Rotește** secretul în Keycloak (client → Credentials → Regenerate). Asta e singurul pas care contează; restul e igienă.
2. Scoate cele 3 apariții și șterge `VITE_KEYCLOAK_SECRET` din `AppConfig.ts:4`.
3. `git rm --cached .env` + `.env` în `.gitignore`.

Și întrebarea de fond: **de ce are un SPA nevoie de un client secret?** N-are. `react-client` e `publicClient: true` în realm — adică Keycloak știe deja că aplicația asta nu poate ține secrete, de asta există PKCE. Secretul ăla nu e folosit nicăieri în calea vie (singura referință e comentată, `KeycloakServices.ts:81`). E un rest dintr-o încercare veche de confidential client. Dispare complet, nu se mută în ConfigMap.

> Notă: valoarea nu corespunde niciunuia dintre clienții din realm-ul actual (`oauth2-proxy` are `BtJSmnt…`, `registration-service` are `my-secret-keycloak`). Probabil e mort. Rotește-l oricum — „probabil e mort" nu e o stare pe care o verifici, e una pe care o presupui.

---

## 🔴 C2 — Imaginea e legată de mediu în momentul build-ului

Asta e blocajul numărul unu pentru pasul C, și acum am dovada. Am rulat `npm run build` pe `master` și am căutat URL-urile în bundle:

```
$ grep -o "http://[a-z.:0-9/-]*" dist/ui/assets/index-*.js | sort -u
http://api.react-app.local
http://auth.react-app.local
http://auth.react-app.local/realms/rsk/protocol/openid-connect/token
http://localhost/kong
http://localhost:3000/ui
```

`api.react-app.local` și `auth.react-app.local` vin din `.env:1-2`. Nu sunt citite la pornire — sunt **înlocuite textual** de Vite în cod, la build. Din clipa în care imaginea e gata, nicio variabilă de mediu, niciun ConfigMap, niciun `values.yaml` nu le mai poate schimba. Dacă publici imaginea asta și o pornești în cluster, UI-ul cere date de la `http://api.react-app.local` — un host care nu există nicăieri în afară de `/etc/hosts`-ul tău.

Compară cu ce ai deja: `data-service` primește `MYSQL_URL`, `KEYCLOAK_ISSUER`, `KAFKA_BOOTSTRAP_SERVERS` din `values.yaml`, la **pornirea procesului**. Aceeași imagine merge oriunde. Aici, o imagine = un mediu. Asta anulează toată ideea de artefact imutabil promovat între medii — ideea pe care ai construit deja restul platformei.

**Ai deja jumătate din soluție în repo, dar nimeni n-o cheamă.** `src/config/useConfig.ts:14` face `fetch(configPath)` — citire la runtime, exact ce trebuie. E importat în `App.tsx:2`… comentat. `src/config/configLoader.ts` are corpul funcției comentat integral (`:8-20`) — returnează `undefined` și atât. Iar `Api.tsx:8` importă `loadConfig` din `utile/utile.tsx`, care e varianta cu `import.meta.env`. Patru fișiere care par să facă același lucru, trei moarte, iar cel viu e cel greșit.

**Fix — un singur loader, chemat o dată, înainte de render.**

`src/config/appConfig.ts` (nou, îl înlocuiește pe `utile/utile.tsx` și pe `configLoader.ts`):
```ts
export interface AppConfig {
  API_URL: string;
  KEYCLOAK_URL: string;
  REALM: string;
  CLIENT_ID: string;
}

let config: AppConfig;

export async function loadAppConfig(): Promise<AppConfig> {
  const res = await fetch("/ui/app-config.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`app-config.json: HTTP ${res.status}`);
  config = await res.json();
  return config;
}

export function appConfig(): AppConfig {
  if (!config) throw new Error("loadAppConfig() nu a fost apelat");
  return config;
}
```

`src/main.jsx` — încarci configul înainte să montezi React, ca nimic să nu poată citi un config gol:
```jsx
import { loadAppConfig } from './config/appConfig';

loadAppConfig().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode><App /></React.StrictMode>
  );
});
```

`MyKeycloakService.ts:18-25` — Keycloak se construiește **după** ce configul există, nu la import:
```ts
constructor() {
  const cfg = appConfig();
  this.keycloak = new Keycloak({ url: cfg.KEYCLOAK_URL, realm: cfg.REALM, clientId: cfg.CLIENT_ID });
}
```
Atenție: `export const myKeycloakService = new MyKeycloakService()` de la `:116` rulează **la import**, deci înainte de `loadAppConfig()`. Fă-l lazy:
```ts
let instance: MyKeycloakService | null = null;
export const myKeycloakService = () => (instance ??= new MyKeycloakService());
```

`Api.tsx:16-22` — scoate `getBaseURL()` și fallback-ul `http://localhost/kong`. Un fallback la localhost e mai rău decât o eroare: în cluster nu crapă, doar cere tăcut de la un host greșit, iar tu cauți bug-ul în rețea. Mai bine `const url = appConfig().API_URL + path;` și, dacă lipsește configul, aplicația refuză să pornească — la `main.jsx`, cu mesaj clar.

`public/app-config.json` rămâne cu valorile de **dev**; în cluster îl suprascrii cu un ConfigMap montat peste el. Un singur build, orice mediu.

---

## 🔴 C3 — Imaginea rulează serverul de development

`Dockerfile:23`
```dockerfile
FROM node:22-alpine3.19
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 3000
ENV HOST=0.0.0.0
CMD ["npm", "run", "dev", "--", "--host"]
```

Neschimbat față de runda 1. Trei probleme separate în 8 linii:

**`npm run dev` nu e „varianta lentă" a producției, e alt program.** Vite dev compilează la cerere, servește module ES netranspilate, ține un WebSocket HMR deschis, expune sursele cu source maps și păstrează în container tot `node_modules` (~400MB) plus codul. Documentația Vite spune explicit să nu-l expui. `--host` îl leagă pe `0.0.0.0`, deci chiar e expus.

**`npm install` în loc de `npm ci`.** `install` poate rezolva dependențele altfel decât `package-lock.json`, deci două build-uri ale aceluiași commit pot da imagini diferite. `ci` respectă lock-ul exact sau eșuează. Într-un lanț unde tag-ul imaginii e SHA-ul commit-ului, „acest SHA = acest cod" trebuie să fie adevărat.

**Build-ul nu rulează niciodată.** Nici în Dockerfile, nici în CI (C10). Consecința am văzut-o direct: la primul `npm run build` pe care l-am rulat eu, Vite a scos două avertismente pe care nimeni nu le-a văzut până acum (C11). Codul ăsta n-a fost niciodată compilat pentru producție.

Pe `feat/keycloak-vite`, commit-ul `bf8b32a` („commit cu dockerfile vechi", de azi) șterge blocul comentat cu multi-stage de la începutul fișierului. Ăla era, în linii mari, **răspunsul corect** — l-ai șters în loc să-l activezi.

**Fix:**
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist/ui /usr/share/nginx/html/ui
COPY config/nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Atenție la două detalii care te vor lovi altfel:
- `vite.config.js:8,10` — `base: '/ui/'` și `outDir: 'dist/ui'`. Deci ieșirea e în `dist/ui`, iar toate resursele sunt cerute de la `/ui/...`. Am confirmat în `dist/ui/index.html`: `<script src="/ui/assets/index-*.js">`. Copiezi în `/usr/share/nginx/html/ui`, nu în rădăcină.
- `App.tsx:49` — `<BrowserRouter basename={"/ui"}>`. Se potrivește cu `base`-ul, e corect. Dar înseamnă că nginx trebuie să facă `try_files` **către `/ui/index.html`**, nu către `/index.html` (C12).

---

## 🔴 C4 — Două instanțe Keycloak în aceeași aplicație

`App.tsx:10` folosește `myKeycloakService` (`MyKeycloakService.ts` — cel bun).
`Home/index.tsx:67` importă `keycloakServicex` (`KeycloakServicex.ts` — cel vechi).
`Register/index.tsx:11` importă tot `keycloakServicex`, plus `AuthState` din el — un **al doilea** tip cu același nume ca cel din `MyKeycloakService.ts:4`.

Ambele fișiere exportă un singleton construit la import (`new Keycloak({...})`). Deci în orice pagină care ajunge la `Home`, browserul are două obiecte Keycloak vii pentru același `react-client`, cu stări separate: unul inițializat (`App.tsx:25`), unul nu. `Home/index.tsx:608` chiar loghează `keycloakServicex.keycloak` lângă un apel la `myKeycloakService.register()` de pe linia următoare.

Azi nu explodează pentru că al doilea nu e niciodată `init()`-uit. Dar e o mină:

`KeycloakServicex.ts:19-22`
```ts
constructor() {
    if (!import.meta.env.VITE_KEYCLOAK_URL) {
        throw new Error("VITE_KEYCLOAK_URL is not defined in .env");
    }
```
Constructorul **aruncă**, și rulează **la import**. În clipa în care faci C2 și scoți `.env` (cum trebuie), `VITE_KEYCLOAK_URL` devine `undefined`, iar aplicația crapă la încărcarea modulului — ecran alb, înainte ca vreo linie din `App.tsx` să ruleze. Vei căuta cauza în configul nou; ea va fi într-un fișier pe care credeai că nu-l mai folosești.

**Fix:** șterge `KeycloakService.ts`, `KeycloakServices.ts`, `KeycloakServicex.ts`. Rămâne `MyKeycloakService.ts`, importat din `Home` și `Register` ca din `App`. Git-ul ține istoria; nu trebuie s-o ții tu în `src/`.

---

## 🔴 C5 — Lanțul CI→GitOps scrie în repo-ul greșit, iar pentru UI nu există nimic

Aici e partea de deploy, și are două straturi.

### Stratul 1: ai două repo-uri gitops care se bat

| | `ms-gitops` | `argo-ms-gitops` |
|---|---|---|
| `bootstrap/root.yaml` → | `ms-gitops.git` | `argo-ms-gitops.git` |
| structura business | `business/rsk/…` | `business/app-microservices/…` |
| numele chart-ului | `charts/microservice` | `charts/api-ms` |
| commit-uri `ci:` (bump automat) | **13** | **0** |
| ArgoCD-ul din cluster citește | ? | acesta (runda 5) |

CI-ul din `constantin-data-api/.github/workflows/ci.yml:51` face bump în:
```yaml
repository: nimigeanconstantinion/ms-gitops
```

Deci: pipeline-ul publică imaginea, actualizează `values.yaml` în `ms-gitops` — **și acolo se oprește**. ArgoCD nu se uită la `ms-gitops`. Tag-urile din `argo-ms-gitops` ajung acolo pentru că le copiezi de mână, ceea ce se vede în istoric: `a58f9d9 changed image data-service`, `73e2829 commit importer-service`. Zero commit-uri `ci:`.

Că tag-urile coincid azi (`data-service: 4c98961`, `importer-service: 27578ab` în ambele) e rezultatul disciplinei tale, nu al automatizării. Prima dată când uiți să copiezi, ArgoCD rulează liniștit o imagine veche și nimic nu semnalează asta — pentru că din punctul lui de vedere totul e Synced.

**Ăsta e cel mai important lucru din tot review-ul**, pentru că nu e un bug într-un fișier: e o gaură în bucla GitOps. Toată ideea e „git = adevărul, iar drumul de la commit la cluster nu are pași manuali". Aici drumul are un pas manual, iar pasul ăla ești tu.

**Fix:** alege **un** repo, arhivează-l pe celălalt, și schimbă `repository:` în cele două CI-uri (`data-api`, `importer-api`) ca să scrie în el. Recomandarea mea: păstrează **`argo-ms-gitops`** — e cel pe care rulează clusterul acum, cu 26/26 Synced+Healthy și cu fix-urile de oauth2-proxy din runda 5. Mutarea CI-ului e o linie în fiecare pipeline; mutarea clusterului ar fi o zi de lucru.

### Stratul 2: pentru client-ui nu există niciun manifest

În niciunul dintre cele două repo-uri nu există: `argo-apps/app-client-ui.yaml`, `business/…/client-ui/values.yaml`, ConfigMap cu `app-config.json`, Ingress. Ghidul [`03-client-ui.md`](../constantin-gitops/docs/migrare/03-client-ui.md) le cere pe toate, la pasul 5.

Chart-ul `charts/api-ms` se potrivește și pentru UI aproape fără modificări — Deployment + Service + Ingress cu cert-manager, exact ce trebuie. Diferențele față de un API: `containerPort: 80`, `service.port: 80`, `probes.path: /ui/index.html`, `ingress.enabled: true`, și un volum montat pentru ConfigMap. Ultimul e singurul lucru pe care chart-ul **nu-l** poate face azi — `templates/deployment.yaml` n-are `volumes`/`volumeMounts`. E de adăugat, condiționat, ca să nu strice serviciile existente.

---

## 🟡 C6 — Realm-ul nu cunoaște host-ul de producție

`argo-ms-gitops/business/app-microservices/keycloak/realm/rsk.yaml:33-36`
```yaml
- clientId: react-client
  publicClient: true
  directAccessGrantsEnabled: true
  redirectUris:
    - "http://localhost:5174/*"
    - "http://localhost:5000/*"
    - "http://localhost:3000/*"
```

În clipa în care UI-ul rulează pe `https://client.icode.mywire.org`, Keycloak refuză login-ul cu `Invalid parameter: redirect_uri`. Primul lucru pe care-l vei vedea în cluster e o eroare care pare de cod și e de config. De adăugat **înainte** de primul deploy:
```yaml
    - "https://client.icode.mywire.org/*"
```

Și, acum că `MyKeycloakService` folosește code flow + PKCE, `directAccessGrantsEnabled: true` nu mai are cine să-l folosească. Toți ceilalți clienți din realm îl au `false`; `react-client` era singura excepție, ținută în viață de vechiul password grant. Pune-l pe `false` — închizi excepția pe care ai creat-o pentru un cod care nu mai există.

---

## 🟡 C7 — API-ul e păzit de un portar care cere cookie, iar UI-ul vine cu Bearer

`business/app-microservices/kong/ingress/data-service-gateway.yaml:9-10`
```yaml
nginx.ingress.kubernetes.io/auth-url: "http://oauth2-proxy.business.svc.cluster.local:4180/oauth2/auth"
nginx.ingress.kubernetes.io/auth-signin: "https://$host/oauth2/start?rd=$escaped_request_uri"
```

Tot ce intră pe `data-service.icode.mywire.org` trece întâi pe la oauth2-proxy. Iar `oauth2-proxy/deployment.yaml:25-43` **nu** are `--skip-jwt-bearer-tokens`. Fără el, oauth2-proxy se uită exclusiv după **cookie-ul lui de sesiune**; un `Authorization: Bearer` nu-l interesează.

Ce se întâmplă concret când UI-ul cheamă `fetch("https://data-service.icode.mywire.org/query", { headers: { Authorization: "Bearer …" }})`:
1. nginx întreabă oauth2-proxy → nu găsește cookie → `401`
2. nginx aplică `auth-signin` → răspunde `302` către `https://data-service.icode.mywire.org/oauth2/start`
3. browserul urmează redirectul **în cadrul cererii XHR**, ajunge la Keycloak, alt origin, fără header CORS
4. `fetch` respinge cu o eroare de rețea generică

Adică: token valid, backend sănătos, și totuși nu merge — cu un mesaj care nu spune nimic. E exact genul de eșec pe care îl cauți ore întregi în locul greșit.

Funcționează azi pentru Swagger pentru că acolo utilizatorul e un **om cu browser**: urmează redirectul, se loghează, primește cookie-ul. Un SPA care face XHR nu poate face asta.

**Fix — o singură variantă, minimă:** spune-i lui oauth2-proxy să lase Bearer-ul să treacă, iar validarea token-ului rămâne unde e deja făcută (data-service are `KEYCLOAK_ISSUER` și `KEYCLOAK_JWK_SET_URI` în `values.yaml:23-24`, deci verifică singur semnătura):

`business/app-microservices/oauth2-proxy/deployment.yaml`, în `args`:
```yaml
            - --skip-jwt-bearer-tokens=true
            - --extra-jwt-issuers=https://auth.icode.mywire.org/realms/rsk=account
```

Cu asta: cererile cu Bearer valid trec direct la Kong → data-service, iar oamenii cu browser primesc în continuare fluxul cu cookie pentru Swagger. Un singur host, o singură schimbare.

Fii conștient de trade-off și spune-l cu voce tare la prezentare: pentru cererile cu Bearer, `--allowed-group=/admins` **nu** se mai aplică — autorizarea rămâne exclusiv în `SecurityConfig` din data-service. Pentru un demo e în regulă, dar e o decizie, nu un detaliu.

---

## 🟡 C8 — CORS: backendul nu știe de originea UI-ului

`constantin-data-api/src/main/resources/application-argo.yaml:11`
```yaml
  cors:
    allowed-origins: ${APP_CORS_ALLOWED_ORIGINS:http://client,http://client:3000,http://localhost:4200}
```

`business/app-microservices/data-service/values.yaml` nu setează `APP_CORS_ALLOWED_ORIGINS`, deci rămâne default-ul — trei origini din era docker-compose. Browserul va bloca orice cerere venită de pe `https://client.icode.mywire.org`, indiferent cât de valid e token-ul.

**Fix**, în `values.yaml` la `env:`:
```yaml
  APP_CORS_ALLOWED_ORIGINS: https://client.icode.mywire.org
```
La fel pentru `importer-service`, dacă UI-ul îl cheamă.

Legat: `Api.tsx` nu mai trimite `Access-Control-Allow-Origin` pe cerere (era U9 în runda 1) — `a9e85ca` „fara alowed-origins in fetch" l-a scos. ✅

---

## 🟡 C9 — Token în `localStorage` și în consolă

`MyKeycloakService.ts:50-55`
```ts
localStorage.setItem("authState", JSON.stringify({
    username: profile.username,
    roles: state.roles,
    authenticated: true,
    token: state.token,
}));
```
`localStorage` e citibil din orice JavaScript de pe pagină. O singură dependență compromisă din cele 20 din `package.json` — sau un XSS — citește token-ul și îl trimite oriunde. `keycloak-js` ține token-ul **în memorie** și îl reîmprospătează singur, exact ca să n-ai nevoie de asta. Ai deja obiectul: `this.keycloak.token` e mereu valid. Scoate `token` din obiectul salvat (username/roles pentru UI sunt inofensive), și citește token-ul din serviciu când îți trebuie.

`Api.tsx:50` — `console.log("Token="+token)` scrie access token-ul în consolă **la fiecare cerere**.
`MyKeycloakService.ts:90` — `console.log(this.keycloak.token)` după login.

Pe un calculator partajat, într-un screenshot trimis pe chat, sau într-o înregistrare de prezentare, ăla e un credențial valabil dăruit. Și, apropo de prezentare: `Api.tsx` are ~15 `console.log` cu `####` și `^^^^^` în calea normală de execuție. Scoate-le înainte de demo.

---

## 🟡 C10 — Pipeline-ul e la o generație distanță de celelalte două

`.github/workflows/deploy.yml`

| linie | acum | ar trebui |
|---|---|---|
| `:22` | `BUILD_NUMBER=$(date '+%d.%m.%Y.%H.%M.%S')` | SHA scurt — ca la data/importer |
| `:25` | `actions/checkout@v2` | `@v4` |
| `:28` | `docker/login-action@v1` | `@v3` |
| `:37` | `REPO=client-microserv-vite` | `client-service` (așa apare în ghid și în `values.yaml`) |
| — | fără `npm ci && npm run build` | job `build-test` înainte de publish |
| `:41-61` | `update-docker-compose` comentat | job `cd-bump` care scrie în gitops |

Punctul cel mai important e cel fără linie: **nu există niciun job care compilează**. Pipeline-ul construiește o imagine care rulează `npm run dev`, deci nici build-ul din Docker nu compilează. Nimic, nicăieri, nu verifică vreodată că proiectul se poate builda. De asta au trecut neobservate avertismentele de la C11.

`ci.yml` de la `importer-service` e deja exact ce-ți trebuie. Copiază-l și schimbă `IMAGE`, `VALUES` și pașii de build (`npm ci` / `npm run build` în loc de Maven).

---

## 🟢 Cleanups

**C11 — CSS care nu există.** `index.html:9-10` linkuiește `./bootstrap.css` și `./bootstrap.min.css`. Fișierele sunt în `src/components/Test/`, nu la rădăcină. Vite spune asta la build:
```
./bootstrap.css doesn't exist at build time, it will remain unchanged to be resolved at runtime
```
„resolved at runtime" = două `404` la fiecare încărcare de pagină, în producție. Bootstrap e deja importat corect din npm în `App.tsx:8` (`bootstrap/dist/css/bootstrap.min.css`), deci cele două linii sunt de șters. La fel `index.html:12`, scriptul de pe `cdn.jsdelivr.net`: o dependență externă la runtime, într-o aplicație care altfel e complet self-contained — și primul lucru care cade dacă rulezi demo-ul fără internet.

**C12 — nginx din era Create React App.** `nginx.conf` și `config/nginx/nginx.conf` (identice, două copii):
```nginx
server { listen 3000; root /app/build; location / { try_files $uri $uri/ /index.html; } }
```
`/app/build` e ce producea CRA; Vite scrie în `dist/ui`. Și, cu `base: '/ui/'`, fallback-ul trebuie să ducă la `/ui/index.html` — altfel un refresh pe `https://host/ui/test` dă 404, pentru că ruta există doar în JS. Păstrează un singur fișier:
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  location /ui/ { try_files $uri $uri/ /ui/index.html; }
  location = / { return 302 /ui/; }
}
```

**C13 — `src/vite-env.d.ts` nu e TypeScript.**
```ts
VITE_API_URL='http://localhost/kong'
VITE_KEYCLOAK_URL='http://localhost/keycloak'
VITE_KEYCLOAK_SECRET="Gyu02seUdOEgZ2hpjeeXx4O9vDg9PwW6"

interface ImportMeta {
    readonly env: ImportMetaEnv
}
```
Primele trei linii sunt atribuiri către variabile nedeclarate, într-un fișier de **declarații de tip** — unde nu are voie să existe cod executabil. Iar `ImportMetaEnv` de la `:6` nu e definit nicăieri în fișier. Nimic nu semnalează asta pentru că nu există niciun `tsc` în proiect: `package.json:6-10` are doar `dev`, `build`, `preview`, iar `vite build` transpilează TypeScript fără să-l verifice (esbuild aruncă tipurile, nu le validează). Ai `typescript` în `devDependencies:37` și un `tsconfig.json`, dar nimeni nu le cheamă. Adaugă `"type-check": "tsc --noEmit"` și pune-l în CI — apoi repară ce iese. Va ieși mai mult decât fișierul ăsta.

**C14 — resturi în git.** `KeycloakService.ts` + `KeycloakServices.ts` + `KeycloakServicex.ts` + `MyKeycloakService.ts` (4 implementări), `config/useConfig.ts` + `src/config/useConfig.ts` (variante diferite), `utile/utile.tsx` + `config/configLoader.ts` (ambele exportă `loadConfig`), `.idea/` (4 fișiere), `package-old.json`, `craco.config.js` (config CRA, proiectul e pe Vite), `migrate-to-vite.js`, `files-docker/`, `setupProxy.js`, `App.test.tsx` (test CRA care nu poate rula), `.bat`-uri, `public/config.production.json` cu `http://34.247.255.42:5000` (IP AWS mort). Plus `.gitignore` care nu conține `.env`, `.idea/` sau `dist/`.

Nu e doar dezordine. La migrare, prima întrebare e „de unde își ia aplicația configul?" — și repo-ul dă patru răspunsuri, dintre care trei sunt moarte. Ai pierdut deja timp pe asta; cine se uită după tine îl va pierde din nou.

---

## Before / After (critice)

| # | Acum | Cum ar trebui |
|---|---|---|
| C1 | `.env:3` + `vite-env.d.ts:3` + `public/config/config.json:4`<br>același secret, livrat la `/ui/config/config.json` | secret **rotit** în Keycloak;<br>`VITE_KEYCLOAK_SECRET` șters din toate cele 3 + din `AppConfig.ts`;<br>`.env` untracked |
| C2 | `const url = import.meta.env.VITE_KEYCLOAK_URL;`<br>→ copt în bundle la build | `const cfg = appConfig();`<br>`fetch("/ui/app-config.json")` la pornire, ConfigMap montat peste el în cluster |
| C3 | `CMD ["npm", "run", "dev", "--", "--host"]` | `RUN npm ci && npm run build` în stage de build<br>+ `FROM nginx:1.27-alpine`, `dist/ui` → `/usr/share/nginx/html/ui` |
| C4 | `Home/index.tsx:67` `import {keycloakServicex}`<br>`Register/index.tsx:11` la fel | un singur `myKeycloakService`, importat peste tot;<br>celelalte 3 fișiere șterse |
| C5 | CI → `ms-gitops`; ArgoCD ← `argo-ms-gitops`;<br>tag-uri copiate manual | `repository: nimigeanconstantinion/argo-ms-gitops` în ambele CI-uri;<br>`ms-gitops` arhivat |
| C7 | oauth2-proxy fără `--skip-jwt-bearer-tokens`<br>→ XHR cu Bearer primește 302 | `--skip-jwt-bearer-tokens=true`<br>`--extra-jwt-issuers=https://auth.icode.mywire.org/realms/rsk=account` |

---

## Ordinea de atacat

Prima grupă e „ca să nu rămână o gaură deschisă", a doua e „ca să intre în cluster", a treia e igienă.

1. **C1** — rotește secretul. Acum, înainte de orice altceva. (10 minute)
2. **C5 stratul 1** — decide repo-ul gitops și mută CI-ul acolo. Până nu faci asta, orice manifest scrii poate ajunge în repo-ul pe care nimeni nu-l citește.
3. **C4** — un singur `KeycloakService`. Trebuie făcut **înainte** de C2, altfel `KeycloakServicex` îți crapă aplicația la import.
4. **C2** — runtime config (`app-config.json` + `loadAppConfig()` în `main.jsx`).
5. **C3** — Dockerfile multi-stage + nginx (C12 vine odată cu el).
6. **C10** — CI copiat de la importer-service: `npm ci` → `type-check` → `build` → imagine cu tag SHA → `cd-bump`.
7. **C6 + C8 + C7** — realm redirectUris, `APP_CORS_ALLOWED_ORIGINS`, `--skip-jwt-bearer-tokens`. Toate trei în gitops, într-un commit.
8. **C5 stratul 2** — `app-client-ui.yaml` + `values.yaml` + ConfigMap + Ingress; `volumes`/`volumeMounts` condiționate în chart-ul `api-ms`.
9. **C9, C11, C13, C14** — token din `localStorage` și `console.log`-uri, CSS fantomă, `tsc --noEmit`, curățenie.

Punctele 1-5 sunt cele care fac diferența între „se poate deploya" și „nu se poate". Restul se poate face după ce vezi UI-ul viu în cluster.

---

## Q&A

**Q1.** Am rulat `npm run build` și am găsit `http://api.react-app.local` scris literal în `dist/ui/assets/index-*.js`. `data-service` primește `MYSQL_URL` prin `env:` din `values.yaml` și aceeași imagine merge în orice mediu. Ambele „citesc configurație". Ce face diferit Vite cu `import.meta.env.VITE_*` față de ce face Spring cu `${MYSQL_URL}`, și în ce **moment** din viața fiecărei aplicații se întâmplă?

**Q2.** Secretul din `public/config/config.json` ajunge în `dist/ui/config/config.json`, adică servit public. Presupunem că îl muți într-un ConfigMap montat în pod, exact ca `app-config.json` de la C2. E secretul protejat acum? Dacă nu — care e diferența dintre „configurație pe care o schimbi per mediu" și „secret", și ce categorie de informație **poate** un SPA să primească vreodată?

**Q3.** CI-ul din `data-api` face bump în `ms-gitops`, ArgoCD citește `argo-ms-gitops`, iar tag-urile din cele două coincid azi. Dacă mâine uiți să copiezi tag-ul, ArgoCD va raporta Application-urile ca **Synced**. De ce e Synced un răspuns corect din punctul lui de vedere, ce anume compară el de fapt — și ce te-ar fi anunțat, în lanțul actual, că rulează o imagine veche?

**Q4.** UI-ul trimite `Authorization: Bearer <token>` către `data-service.icode.mywire.org`. Token-ul e valid, data-service e sănătos, și totuși `fetch` respinge cu o eroare de rețea fără detalii. Urmărește cererea prin nginx → oauth2-proxy → înapoi la browser și spune la care pas se pierde token-ul. De ce același token, pus în Swagger UI din browser, funcționează?

# 🧊 FrigoZero - Dispensa & Spesa Intelligente a Costo Zero

> **Gestione intelligente della dispensa, lista della spesa per reparto e ricette anti-spreco personalizzate con Google Gemini AI.**  
> Progettato per funzionare al **100% a costo zero** sfruttando l'ecosistema gratuito di **GitHub Pages** (Frontend PWA), **Google Sheets / Apps Script** (Database & API) e **Google Gemini API** (Free Tier).

---

## 🌟 Caratteristiche Principali

- 🧠 **Analisi Naturale e Vocale con Gemini AI (`gemini-2.5-flash`):** Inserisci a voce o scrivendo liberamente frasi come *"uova, 2 zucchine, latte in scadenza, petto di pollo"*. L'IA estrae automaticamente alimento, quantità, reparto del supermercato, stima della data di scadenza e livello di urgenza.
- 📦 **Dispensa Anti-Spreco:** Monitoraggio visivo con badge colorati per urgenza (Rosso: urgente/scade oggi; Giallo: entro 3-5gg; Verde: lunga durata) e pulsante rapido con un tocco **"Consumato"**.
- 👨‍🍳 **Chef Virtuale "Cosa Cucino":** Filtra per tempo disponibile (`15 min`, `30 min`, `45+ min`) e modalità (*"Solo quello che ho in casa"* vs *"Anche con 1-2 ingredienti extra"*). Gemini analizza gli ingredienti che stanno per scadere e propone 3 ricette pratiche, con il pulsante magico **"Aggiungi mancanti alla Spesa"**.
- 🛒 **Spesa Intelligente Organizzata per Reparto:** Articoli raggruppati automaticamente per corsia del supermercato (*Ortofrutta, Frigo/Latticini, Carne/Pesce, Dispensa, Surgelati, Altro*), checkbox grandi adatti all'uso con una sola mano e pulsante sticky **"Ho finito la spesa (Sposta in Dispensa)"**, che calcola le date di scadenza e trasferisce tutto nella dispensa.
- 📱 **Mobile-First PWA:** Installabile come applicazione nativa a schermo intero su **iOS (iPhone/iPad)** e **Android**.
- 🔒 **Privacy Totale & Zero Server:** Nessun backend o database proprietario da pagare o mantenere. Le chiavi e le impostazioni rimangono memorizzate nel tuo browser (`localStorage`) e i dati risiedono esclusivamente nel tuo Foglio Google privato.

---

## 🏗️ Architettura Zero-Cost

```
   ┌─────────────────────────────────────────────────────────────┐
   │               Frontend: GitHub Pages (PWA)                  │
   │           React 18 + Vite + TypeScript + Tailwind CSS       │
   └───────────────┬─────────────────────────────┬───────────────┘
                   │                             │
    Chiamate REST  │              Chiamate REST  │
     (Testo/Voce)  ▼                             ▼  (JSON Prompt)
┌─────────────────────────────────┐   ┌──────────────────────────┐
│   Google Sheets + Apps Script   │   │     Google Gemini API    │
│    Database Serverless Gratuito │   │  gemini-2.5-flash (Free) │
│ (Dispensa, Spesa, Ricette)      │   │ (Parsing NLP & Ricette)  │
└─────────────────────────────────┘   └──────────────────────────┘
```

---

## 🚀 Guida di Configurazione Passo-Passo

Segui questi semplici passaggi per essere operativo in meno di 5 minuti.

---

### PASSO 1: Configurare Google Sheets e Apps Script (Database)

1. Vai su [Google Fogli](https://sheets.new) e crea un nuovo foglio vuoto.
2. Rinomina il foglio come preferisci (ad es. **"FrigoZero Database"**).
3. Nel menu in alto, clicca su **Estensioni** > **Apps Script**.
4. Cancella qualsiasi codice presente nell'editor e incolla l'intero contenuto del file [`google-apps-script/Code.gs`](./google-apps-script/Code.gs).
5. *(Opzionale)* In cima al codice, se vuoi puoi impostare una password nel campo `const SECRET_TOKEN = "il_tuo_token_segreto";`. Se lo lasci vuoto `""`, l'accesso sarà comunque protetto dall'URL univoco generato da Google.
6. Clicca sull'icona **Salva** (dischetto).
7. In alto a destra, clicca sul pulsante blu **Distribuisci** > **Nuova distribuzione**.
8. Clicca sull'icona dell'ingranaggio accanto a "Seleziona tipo" e scegli **Applicazione web**.
9. Configura i campi come segue:
   - **Descrizione:** `FrigoZero API`
   - **Esegui come:** `Me (tuo indirizzo email)`
   - **Chi ha accesso:** **`Chiunque`** *(MOLTO IMPORTANTE: permette alla tua PWA su GitHub Pages di leggere e scrivere i dati)*.
10. Clicca su **Distribuisci**. Se è la prima volta, Google ti chiederà di autorizzare l'accesso:
    - Clicca su *Autorizza accesso*.
    - Seleziona il tuo account Google.
    - Clicca su *Avanzate* (in basso a sinistra) e poi su *Apri FrigoZero (non sicuro)*.
    - Clicca su *Consenti*.
11. **Copia l'URL dell'applicazione web** generato (termina con `/exec`). Lo incollerai nelle impostazioni dell'app.

> 💡 **Nota automatica:** Non serve creare a mano le colonne o i fogli: la funzione `setupSheet()` inclusa nel codice creerà e formatterà automaticamente le 3 schede (`Dispensa`, `Spesa`, `Ricette_Salvate`) alla prima chiamata!

---

### PASSO 2: Ottenere la Chiave API Gratuita di Google Gemini

1. Accedi a [Google AI Studio](https://aistudio.google.com/app/apikey) con il tuo account Google.
2. Clicca su **Create API Key** (Crea chiave API).
3. Seleziona o crea un progetto Google Cloud gratuito.
4. Copia la stringa della chiave API generata (inizia tipicamente con `AIzaSy...`).

*(Il piano Free Tier di Google include centinaia di richieste al giorno senza alcuna spesa né carta di credito richiesta).*

---

### PASSO 3: Pubblicare il Frontend su GitHub Pages

Il progetto include già il file di configurazione per il sub-path (`base: './'` in `vite.config.ts`) e il workflow automatico di GitHub Actions in `.github/workflows/deploy.yml`.

1. Crea un nuovo repository su GitHub (es. `frigo-zero`).
2. Nella cartella del progetto sul tuo computer, inizializza git e carica i file:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: FrigoZero pronto per il deploy"
   git branch -M main
   git remote add origin https://github.com/TUO-USERNAME/frigo-zero.git
   git push -u origin main
   ```
3. Vai sul tuo repository su GitHub e clicca su **Settings** > **Pages** (nel menu laterale sinistro).
4. Nella sezione **Build and deployment**, sotto **Source**, seleziona:
   - **`GitHub Actions`**
5. Vai nella scheda **Actions** del repository: vedrai il workflow *Deploy FrigoZero to GitHub Pages* in esecuzione.
6. Al termine (circa 1 minuto), la tua app sarà live all'indirizzo:
   `https://TUO-USERNAME.github.io/frigo-zero/`

---

### PASSO 4: Configurare l'App e Installarla sullo Smartphone

1. Apri dal tuo telefono il link di GitHub Pages generato al Passo 3.
2. Clicca sull'icona dell'**ingranaggio** in alto a destra per aprire le **Impostazioni**.
3. Incolla:
   - **URL Web App Google Apps Script** (da Passo 1)
   - **Secret Token** (se impostato in `Code.gs`, altrimenti lascia vuoto)
   - **Chiave API Google Gemini** (da Passo 2)
4. Disattiva la *Modalità Demo* (oppure clicca su *Verifica Connessione Sheets* per controllare subito il collegamento).
5. Clicca su **Salva Impostazioni**.

#### 📱 Installazione come PWA sullo Smartphone:
- **Su iPhone (Safari):** Tocca l'icona di condivisione in basso (quadrato con freccia verso l'alto) e seleziona **"Aggiungi alla schermata Home"**.
- **Su Android (Chrome):** Tocca i tre puntini in alto a destra e seleziona **"Installa app"** o **"Aggiungi a schermata Home"**.

Ora avrai FrigoZero come un'app nativa sul tuo telefono, pronta all'uso ogni giorno!

---

## 🛠️ Sviluppo Locale

Se desideri modificare o personalizzare il codice sul tuo computer:

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo con hot reload
npm run dev

# Compila il bundle di produzione per verifica
npm run build
```

---

## 📂 Struttura del Progetto

```
Frigo Zero/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Workflow CI/CD automatico per GitHub Pages
├── google-apps-script/
│   └── Code.gs                 # Backend serverless REST JSON per Google Sheets
├── public/
│   ├── favicon.svg             # Icona vettoriale dell'applicazione
│   ├── manifest.json           # Configurazione PWA per mobile
│   └── sw.js                   # Service Worker per cache e supporto offline
├── src/
│   ├── components/
│   │   ├── Header.tsx          # Topbar con stato connessione e ingranaggio
│   │   ├── Navbar.tsx          # Barra di navigazione fissa in basso
│   │   ├── SettingsModal.tsx   # Modale per URL Sheets, Token e Gemini API Key
│   │   └── VoiceInputButton.tsx# Riconoscimento vocale Web Speech API
│   ├── services/
│   │   ├── gasApi.ts           # Client API per Google Apps Script (CORS bypass)
│   │   ├── geminiApi.ts        # Client per Gemini 2.5 Flash (NLP e Ricette)
│   │   ├── mockData.ts         # Dati realistici per la modalità Demo
│   │   └── storage.ts          # Gestione localStorage e cache offline
│   ├── tabs/
│   │   ├── DispensaTab.tsx     # Tab 1: Gestione scadenze e input vocale/NLP
│   │   ├── CosaCucinoTab.tsx   # Tab 2: Chef anti-spreco Gemini con ricette
│   │   └── SpesaTab.tsx        # Tab 3: Spesa per reparto e trasferimento in dispensa
│   ├── types/
│   │   └── index.ts            # Tipi TypeScript completi
│   ├── App.tsx                 # Componente radice e orchestrazione stato
│   ├── index.css               # Stili Tailwind CSS e safe-area iOS
│   └── main.tsx                # Entry point React
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts              # Configurazione Vite con base relativa './'
└── README.md                   # Documentazione completa
```

---

## 💡 Risoluzione dei Problemi Frequenti

#### 1. "Impossibile raggiungere l'URL di Google Apps Script"
- Assicurati che durante la distribuzione della Web App su Google Apps Script tu abbia selezionato **Chi ha accesso: "Chiunque"**.
- Se hai modificato il codice su `Code.gs`, ricorda di fare: **Distribuisci > Gestisci distribuzioni > Modifica > Nuova versione > Salva**.

#### 2. Dettatura vocale non attiva
- Il pulsante microfono usa la Web Speech API del browser. Assicurati di aver concesso il permesso di accesso al microfono quando richiesto dal browser.
- Su iOS, la dettatura richiede Safari o la PWA aggiunta alla schermata Home.

#### 3. Modalità Demo vs Modalità Online
- Quando apri l'app per la prima volta, troverai la **Modalità Demo** attiva con dati di esempio precaricati, così da poter provare subito l'interfaccia.
- Una volta inseriti l'URL di Apps Script e la chiave Gemini, disattiva la Modalità Demo dal modale Impostazioni per sincronizzare i tuoi dati reali con il tuo Foglio Google.

---

## 📜 Licenza
Questo progetto è distribuito sotto licenza **MIT**. Sentiti libero di usarlo, personalizzarlo e condividerlo per ridurre gli sprechi alimentari!

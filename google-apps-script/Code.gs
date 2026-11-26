/**
 * =========================================================================
 * FrigoZero - Google Apps Script Backend (API Database Google Sheets)
 * =========================================================================
 * 
 * Questo script trasforma un Google Sheet in un backend REST API JSON a costo zero
 * per l'applicazione FrigoZero.
 * 
 * ISTRUZIONI:
 * 1. Crea un Foglio Google vuoto (es. "FrigoZero_DB").
 * 2. Clicca su Estensioni > Apps Script.
 * 3. Incolla questo file sostituendo il codice esistente.
 * 4. (Opzionale) Modifica la costante SECRET_TOKEN qui sotto.
 * 5. Clicca su "Distribuisci" > "Nuova distribuzione".
 * 6. Seleziona tipo: "Applicazione web".
 * 7. Descrizione: "FrigoZero API v1".
 * 8. Esegui come: "Utente proprietario dell'applicazione web" (Tu).
 * 9. Chi ha accesso: "Chiunque" (importante per consentire chiamate dal browser).
 * 10. Clicca "Distribuisci", autorizza i permessi e copia l'URL dell'applicazione web.
 */

// ==========================================
// CONFIGURAZIONE
// ==========================================
// Se desideri proteggere l'API, imposta una password o token casuale (es: "mypassword123").
// Se lasci vuoto "", chiunque con l'URL potrà leggere/scrivere.
const SECRET_TOKEN = "";

// Nomi dei Fogli
const SHEET_DISPENSA = "Dispensa";
const SHEET_SPESA = "Spesa";
const SHEET_RICETTE = "Ricette_Salvate";

// Intestazioni delle tabelle
const HEADERS_DISPENSA = ["id", "ingrediente", "quantita", "reparto", "scadenza_stimata", "urgenza", "data_inserimento"];
const HEADERS_SPESA = ["id", "articolo", "quantita", "reparto", "comprato"];
const HEADERS_RICETTE = ["id", "titolo", "tempo_min", "ingredienti_usati", "procedimento"];

/**
 * Gestione richieste GET (Utile per test rapido dal browser o recupero dati)
 */
function doGet(e) {
  try {
    ensureSetup();

    const params = e && e.parameter ? e.parameter : {};
    const token = params.token || "";
    const action = params.action || "status";

    if (!validateToken(token)) {
      return jsonResponse({ success: false, error: "Accesso negato: Secret Token non valido." }, 401);
    }

    if (action === "getAll") {
      const data = getAllData();
      return jsonResponse({ success: true, data: data });
    }

    return jsonResponse({
      success: true,
      message: "FrigoZero Google Apps Script Web App attiva e funzionante!",
      version: "1.0.0",
      actions_available: ["getAll", "addDispensa", "deleteDispensa", "addSpesa", "toggleSpesa", "moveSpesaToDispensa", "saveRecipe", "deleteRecipe"]
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Gestione richieste POST (Tutte le azioni dell'app web)
 */
function doPost(e) {
  try {
    ensureSetup();

    let requestBody = {};
    if (e && e.postData && e.postData.contents) {
      try {
        requestBody = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        requestBody = e.parameter || {};
      }
    } else if (e && e.parameter) {
      requestBody = e.parameter;
    }

    const token = requestBody.token || "";
    const action = requestBody.action;
    const payload = requestBody.payload || {};

    if (!validateToken(token)) {
      return jsonResponse({ success: false, error: "Accesso negato: Secret Token non valido." }, 401);
    }

    let result = {};

    switch (action) {
      case "getAll":
        result = { success: true, data: getAllData() };
        break;

      case "addDispensa":
        result = handleAddDispensa(payload);
        break;

      case "deleteDispensa":
        result = handleDeleteDispensa(payload);
        break;

      case "addSpesa":
        result = handleAddSpesa(payload);
        break;

      case "toggleSpesa":
        result = handleToggleSpesa(payload);
        break;

      case "deleteSpesa":
        result = handleDeleteSpesa(payload);
        break;

      case "moveSpesaToDispensa":
        result = handleMoveSpesaToDispensa();
        break;

      case "saveRecipe":
        result = handleSaveRecipe(payload);
        break;

      case "deleteRecipe":
        result = handleDeleteRecipe(payload);
        break;

      case "setup":
        setupSheet();
        result = { success: true, message: "Fogli ricreati e formattati con successo." };
        break;

      default:
        return jsonResponse({ success: false, error: "Azione sconosciuta: " + action });
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ==========================================
// FUNZIONI LOGICA DI BUSINESS
// ==========================================

/**
 * Recupera tutte le righe di Dispensa, Spesa e Ricette
 */
function getAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const dispensaSheet = ss.getSheetByName(SHEET_DISPENSA);
  const spesaSheet = ss.getSheetByName(SHEET_SPESA);
  const ricetteSheet = ss.getSheetByName(SHEET_RICETTE);

  return {
    dispensa: readSheetObjects(dispensaSheet, HEADERS_DISPENSA),
    spesa: readSheetObjects(spesaSheet, HEADERS_SPESA),
    ricette: readSheetObjects(ricetteSheet, HEADERS_RICETTE)
  };
}

/**
 * Aggiunge uno o più elementi a Dispensa
 */
function handleAddDispensa(payload) {
  const items = Array.isArray(payload) ? payload : (payload.items ? payload.items : [payload]);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DISPENSA);
  const nowIso = new Date().toISOString().split("T")[0];

  const addedItems = [];

  items.forEach(function(item) {
    if (!item.ingrediente) return;

    const id = item.id || generateId();
    const ingrediente = String(item.ingrediente).trim();
    const quantita = item.quantita || "1";
    const reparto = item.reparto || "Altro";
    const scadenza = item.scadenza_stimata || calculateDefaultExpiry(reparto);
    const urgenza = item.urgenza || calculateUrgency(scadenza);
    const dataIns = item.data_inserimento || nowIso;

    sheet.appendRow([id, ingrediente, quantita, reparto, scadenza, urgenza, dataIns]);

    addedItems.push({
      id: id,
      ingrediente: ingrediente,
      quantita: quantita,
      reparto: reparto,
      scadenza_stimata: scadenza,
      urgenza: urgenza,
      data_inserimento: dataIns
    });
  });

  return { success: true, count: addedItems.length, items: addedItems };
}

/**
 * Elimina uno o più elementi da Dispensa tramite ID
 */
function handleDeleteDispensa(payload) {
  const idsToDelete = Array.isArray(payload) 
    ? payload 
    : (Array.isArray(payload.ids) ? payload.ids : (payload.id ? [payload.id] : []));
  if (idsToDelete.length === 0) {
    return { success: false, error: "Nessun ID fornito per l'eliminazione." };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DISPENSA);
  const deletedCount = deleteRowsById(sheet, idsToDelete);

  return { success: true, deletedCount: deletedCount };
}

/**
 * Aggiunge uno o più articoli alla lista Spesa
 */
function handleAddSpesa(payload) {
  const items = Array.isArray(payload) ? payload : (payload.items ? payload.items : [payload]);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SPESA);

  const addedItems = [];

  items.forEach(function(item) {
    if (!item.articolo) return;

    const id = item.id || generateId();
    const articolo = String(item.articolo).trim();
    const quantita = item.quantita || "1";
    const reparto = item.reparto || "Altro";
    const comprato = item.comprato === true || item.comprato === "TRUE" ? true : false;

    sheet.appendRow([id, articolo, quantita, reparto, comprato]);

    addedItems.push({
      id: id,
      articolo: articolo,
      quantita: quantita,
      reparto: reparto,
      comprato: comprato
    });
  });

  return { success: true, count: addedItems.length, items: addedItems };
}

/**
 * Aggiorna lo stato `comprato` (TRUE/FALSE) di un articolo della Spesa
 */
function handleToggleSpesa(payload) {
  const id = payload.id;
  if (!id) return { success: false, error: "ID articolo spesa mancante." };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SPESA);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      const currentVal = Boolean(data[i][4]);
      const newVal = payload.comprato !== undefined ? Boolean(payload.comprato) : !currentVal;
      sheet.getRange(i + 1, 5).setValue(newVal);
      return { success: true, id: id, comprato: newVal };
    }
  }

  return { success: false, error: "Articolo spesa non trovato." };
}

/**
 * Elimina uno o più articoli dalla Spesa
 */
function handleDeleteSpesa(payload) {
  const idsToDelete = Array.isArray(payload.ids) ? payload.ids : (payload.id ? [payload.id] : []);
  if (idsToDelete.length === 0) {
    return { success: false, error: "Nessun ID fornito per l'eliminazione." };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SPESA);
  const deletedCount = deleteRowsById(sheet, idsToDelete);

  return { success: true, deletedCount: deletedCount };
}

/**
 * Sposta tutti gli articoli con comprato = TRUE da Spesa a Dispensa
 * Calcola automaticamente la scadenza stimata in base al reparto e l'urgenza,
 * aggiunge gli articoli a Dispensa e li rimuove da Spesa.
 */
function handleMoveSpesaToDispensa() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const spesaSheet = ss.getSheetByName(SHEET_SPESA);
  const dispensaSheet = ss.getSheetByName(SHEET_DISPENSA);

  const spesaData = spesaSheet.getDataRange().getValues();
  if (spesaData.length <= 1) {
    return { success: true, movedCount: 0, message: "Nessun articolo nella spesa." };
  }

  const nowIso = new Date().toISOString().split("T")[0];
  const rowsToMove = [];
  const rowsToDeleteIndices = [];

  for (let i = 1; i < spesaData.length; i++) {
    const row = spesaData[i];
    const isComprato = row[4] === true || String(row[4]).toUpperCase() === "TRUE";

    if (isComprato) {
      const id = row[0] || generateId();
      const ingrediente = row[1];
      const quantita = row[2] || "1";
      const reparto = row[3] || "Altro";
      const scadenza = calculateDefaultExpiry(reparto);
      const urgenza = calculateUrgency(scadenza);

      rowsToMove.push([id, ingrediente, quantita, reparto, scadenza, urgenza, nowIso]);
      rowsToDeleteIndices.push(i + 1); // 1-based row index nel foglio
    }
  }

  if (rowsToMove.length === 0) {
    return { success: true, movedCount: 0, message: "Nessun articolo spuntato come 'comprato'." };
  }

  // Aggiungi a Dispensa
  rowsToMove.forEach(function(row) {
    dispensaSheet.appendRow(row);
  });

  // Rimuovi da Spesa in ordine decrescente per preservare gli indici
  rowsToDeleteIndices.sort(function(a, b) { return b - a; });
  rowsToDeleteIndices.forEach(function(rowIndex) {
    spesaSheet.deleteRow(rowIndex);
  });

  return {
    success: true,
    movedCount: rowsToMove.length,
    message: "Spostati con successo " + rowsToMove.length + " articoli in Dispensa."
  };
}

/**
 * Salva una ricetta generata
 */
function handleSaveRecipe(payload) {
  if (!payload || !payload.titolo) {
    return { success: false, error: "Titolo ricetta mancante." };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RICETTE);
  const id = payload.id || generateId();
  const titolo = String(payload.titolo);
  const tempo = payload.tempo_min || 30;
  const ingredienti = Array.isArray(payload.ingredienti_usati) ? payload.ingredienti_usati.join(", ") : String(payload.ingredienti_usati || "");
  const procedimento = Array.isArray(payload.procedimento) ? payload.procedimento.join("\n") : String(payload.procedimento || "");

  sheet.appendRow([id, titolo, tempo, ingredienti, procedimento]);

  return { success: true, id: id, titolo: titolo };
}

/**
 * Elimina una ricetta salvata
 */
function handleDeleteRecipe(payload) {
  const idsToDelete = Array.isArray(payload.ids) ? payload.ids : (payload.id ? [payload.id] : []);
  if (idsToDelete.length === 0) {
    return { success: false, error: "Nessun ID fornito." };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RICETTE);
  const deletedCount = deleteRowsById(sheet, idsToDelete);

  return { success: true, deletedCount: deletedCount };
}

// ==========================================
// FUNZIONI DI SUPPORTO & SETUP
// ==========================================

/**
 * Setup iniziale del foglio: crea le schede se non esistono e formatta le intestazioni
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  setupSingleSheet(ss, SHEET_DISPENSA, HEADERS_DISPENSA, "#059669"); // Smeraldo
  setupSingleSheet(ss, SHEET_SPESA, HEADERS_SPESA, "#2563EB");       // Blu
  setupSingleSheet(ss, SHEET_RICETTE, HEADERS_RICETTE, "#D97706");   // Ambra

  // Se esiste ancora il "Foglio 1" predefinito e vuoto, possiamo rimuoverlo
  const defaultSheet = ss.getSheetByName("Foglio1") || ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }
}

function setupSingleSheet(ss, sheetName, headers, headerColor) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    // Aggiorna intestazioni prima riga
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // Stile grafico intestazioni
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(headerColor)
             .setFontColor("#FFFFFF")
             .setFontWeight("bold")
             .setFontSize(11)
             .setHorizontalAlignment("center");
  
  sheet.setFrozenRows(1);

  // Larghezze colonne per leggibilità
  for (let c = 1; c <= headers.length; c++) {
    sheet.setColumnWidth(c, 160);
  }
  sheet.setColumnWidth(2, 220); // Nome ingrediente/articolo più largo
}

/**
 * Assicura che i fogli esistano prima di procedere
 */
function ensureSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(SHEET_DISPENSA) || !ss.getSheetByName(SHEET_SPESA)) {
    setupSheet();
  }
}

/**
 * Legge tutte le righe di un foglio trasformandole in oggetti JSON
 */
function readSheetObjects(sheet, headers) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function(row) {
    const obj = {};
    headers.forEach(function(header, idx) {
      let val = row[idx];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd");
      }
      obj[header] = val;
    });
    return obj;
  });
}

/**
 * Elimina righe corrispondenti agli ID indicati
 */
function deleteRowsById(sheet, idsToDelete) {
  if (!sheet) return 0;
  const data = sheet.getDataRange().getValues();
  let count = 0;

  for (let i = data.length - 1; i >= 1; i--) {
    const rowId = String(data[i][0]);
    if (idsToDelete.indexOf(rowId) !== -1) {
      sheet.deleteRow(i + 1);
      count++;
    }
  }
  return count;
}

/**
 * Calcola la data di scadenza stimata di default in base al reparto
 */
function calculateDefaultExpiry(reparto) {
  const daysMap = {
    "Carne/Pesce": 3,
    "Frigo/Latticini": 5,
    "Ortofrutta": 7,
    "Surgelati": 90,
    "Dispensa": 30,
    "Altro": 14
  };

  const daysToAdd = daysMap[reparto] || 10;
  const d = new Date();
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().split("T")[0];
}

/**
 * Calcola l'urgenza in base alla data di scadenza stimata
 */
function calculateUrgency(scadenzaIso) {
  if (!scadenzaIso) return "bassa";
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const exp = new Date(scadenzaIso);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 2) return "alta";
  if (diffDays <= 5) return "media";
  return "bassa";
}

/**
 * Genera un ID univoco casuale
 */
function generateId() {
  return "fz_" + Utilities.getUuid().substring(0, 8);
}

/**
 * Valida il secret token configurato
 */
function validateToken(providedToken) {
  if (!SECRET_TOKEN || SECRET_TOKEN.trim() === "") {
    return true; // Nessun token richiesto
  }
  return String(providedToken).trim() === SECRET_TOKEN.trim();
}

/**
 * Risposta standard JSON con intestazioni CORS
 */
function jsonResponse(data, statusCode) {
  const output = JSON.stringify(data);
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

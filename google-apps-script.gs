/**
 * MARBELLA CONCIERGE — Réception des leads dans Google Sheets
 * ----------------------------------------------------------------------
 * Ce script reçoit les informations envoyées par le site (formulaire +
 * pop-up, MÊME non validés) et les enregistre dans une feuille Google Sheets.
 *
 * Chaque visiteur possède un "Lead ID" unique : tant qu'il remplit le
 * formulaire, on MET À JOUR sa ligne (pas de doublon). Vous voyez ainsi sa
 * fiche se compléter en direct, et pouvez relancer ceux qui n'ont pas validé.
 *
 * 👉 Guide d'installation / mise à jour en bas de ce fichier.
 */

var HEADERS = [
  'Lead ID', 'Date réception', 'Dernière MAJ', 'Statut',
  'Prénom', 'Nom', 'Email', 'WhatsApp', 'Dates', 'Personnes',
  'Type', 'Services', 'Message', 'Page'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); // évite que deux leads s'écrivent en même temps

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Leads') || ss.insertSheet('Leads');

    // Crée la ligne d'en-têtes la première fois
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }

    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    var now = new Date();
    var leadId = data.leadId || ('sans-id-' + now.getTime());

    // Cherche une ligne existante avec ce Lead ID (colonne 1)
    var rowIndex = -1;
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (ids[i][0] === leadId) { rowIndex = i + 2; break; }
      }
    }

    // Conserve la date de 1re réception si la ligne existe déjà
    var firstSeen = now;
    if (rowIndex !== -1) {
      var existing = sheet.getRange(rowIndex, 2).getValue();
      if (existing) firstSeen = existing;
    }

    var row = [
      leadId,
      firstSeen,
      now,
      data.statut    || '',
      data.prenom    || '',
      data.nom       || '',
      data.email     || '',
      data.whatsapp  || '',
      data.dates     || '',
      data.personnes || '',
      data.type      || '',
      data.services  || '',
      data.message   || '',
      data.page      || ''
    ];

    if (rowIndex === -1) {
      sheet.appendRow(row);                              // nouveau lead
    } else {
      sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]); // mise à jour
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Permet de tester l'URL dans un navigateur (doit afficher "Marbella OK").
function doGet() {
  return ContentService.createTextOutput('Marbella OK');
}

/* ======================================================================
   GUIDE — Installer OU mettre à jour le script
   ======================================================================

   ⭐ SI VOUS AVEZ DÉJÀ DÉPLOYÉ une 1re version (cas le plus courant) :
   ----------------------------------------------------------------------
   1. Ouvrez votre Google Sheet ▸ Extensions ▸ Apps Script.
   2. Effacez tout l'ancien code, collez TOUT ce nouveau fichier
      (jusqu'à juste avant ce guide), puis 💾 Enregistrer.
   3. Cliquez sur "Déployer" ▸ "Gérer les déploiements".
   4. Sur votre déploiement existant, cliquez sur le crayon ✏️ (Modifier).
   5. Dans "Version", choisissez "Nouvelle version" ▸ "Déployer".
      ➡️ L'URL NE CHANGE PAS : rien d'autre à faire sur le site.

   🆕 PREMIÈRE INSTALLATION (si vous partez de zéro) :
   ----------------------------------------------------------------------
   1. https://sheets.google.com ▸ créez une feuille de calcul vierge.
   2. Extensions ▸ Apps Script.
   3. Effacez le code par défaut, collez ce fichier, 💾 Enregistrer.
   4. "Déployer" ▸ "Nouveau déploiement" ▸ roue ⚙️ ▸ "Application Web".
        • Exécuter en tant que : Moi
        • Qui a accès : "Tout le monde"   ⬅️ INDISPENSABLE
   5. "Déployer" ▸ autorisez l'accès (Paramètres avancés ▸ Accéder à… ▸
      Autoriser : c'est normal, l'application c'est vous).
   6. Copiez l'URL en .../exec et collez-la dans index.html :
        const LEAD_ENDPOINT = "https://script.google.com/macros/s/XXXX/exec";

   ✅ POUR TESTER : collez l'URL .../exec dans un navigateur → vous devez
      voir "Marbella OK". Puis remplissez le formulaire du site : une ligne
      apparaît (et se met à jour au fur et à mesure) dans l'onglet "Leads".

   ℹ️ La colonne "Statut" indique d'où vient le lead :
      • "saisie en cours"     → en train de remplir, pas encore validé
      • "popup"               → a soumis la pop-up d'arrivée
      • "abandon"             → a quitté la page sans envoyer  ← à RELANCER
      • "formulaire envoyé"   → a cliqué sur le bouton WhatsApp
   ====================================================================== */

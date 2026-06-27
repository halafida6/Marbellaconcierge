/**
 * MARBELLA CONCIERGE — Réception des leads dans Google Sheets
 * ----------------------------------------------------------------------
 * Ce script reçoit les informations envoyées par le site (formulaire +
 * pop-up, même non validés) et les ajoute automatiquement dans une feuille
 * Google Sheets, ligne par ligne. Vous pourrez ainsi relancer les clients
 * non contactés.
 *
 * 👉 Suivez le GUIDE D'INSTALLATION en bas de ce fichier (en commentaire).
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); // évite que deux leads s'écrivent en même temps

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads')
             || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Leads');

    // Crée la ligne d'en-têtes la première fois
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Date réception', 'Statut', 'Prénom', 'Nom', 'Email', 'WhatsApp',
        'Dates', 'Personnes', 'Type', 'Services', 'Message', 'Page'
      ]);
      sheet.setFrozenRows(1);
    }

    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    sheet.appendRow([
      new Date(),
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
    ]);

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
   GUIDE D'INSTALLATION — étape par étape
   ======================================================================

   ÉTAPE 1 — Créer la feuille de calcul
   ------------------------------------
   1. Allez sur https://sheets.google.com
   2. Cliquez sur "+ Vierge" pour créer un nouveau Google Sheet.
   3. (Optionnel) Renommez-le "Leads Marbella".

   ÉTAPE 2 — Ouvrir l'éditeur de script (c'est ICI le "Web App")
   -------------------------------------------------------------
   Dans votre Google Sheet, en haut, cliquez sur :
        Extensions  ▸  Apps Script
   (Si vous ne voyez pas "Extensions", c'est que vous êtes sur l'appli
    mobile : faites-le depuis un ordinateur, c'est plus simple.)

   ÉTAPE 3 — Coller le script
   --------------------------
   1. Une nouvelle page "Apps Script" s'ouvre avec un fichier Code.gs
      contenant "function myFunction() {}".
   2. Effacez TOUT son contenu.
   3. Copiez-collez TOUT le code de ce fichier (de la 1re ligne jusqu'à
      juste avant ce guide).
   4. Cliquez sur l'icône disquette 💾 (Enregistrer) en haut.

   ÉTAPE 4 — Déployer en application Web ("Web App")
   -------------------------------------------------
   1. En haut à droite, cliquez sur le bouton bleu  "Déployer"  ▸
      "Nouveau déploiement".
   2. Cliquez sur la petite roue ⚙️ à gauche ("Sélectionner le type")
      et choisissez  "Application Web".
   3. Remplissez :
        • Description : "Marbella leads" (peu importe)
        • Exécuter en tant que : Moi (votre compte)
        • Qui a accès : "Tout le monde"   ⬅️ TRÈS IMPORTANT
   4. Cliquez sur "Déployer".
   5. Google demande une autorisation :
        → "Autoriser l'accès" → choisissez votre compte
        → écran "Google n'a pas validé cette application" :
          cliquez sur "Paramètres avancés" puis
          "Accéder à … (non sécurisé)" → "Autoriser".
      (C'est normal : l'application, c'est VOUS.)
   6. Google affiche une "URL de l'application Web" qui ressemble à :
        https://script.google.com/macros/s/AKfyc.../exec
      ➡️ COPIEZ cette URL.

   ÉTAPE 5 — Brancher l'URL sur le site
   ------------------------------------
   Dans le fichier index.html, trouvez la ligne :
        const LEAD_ENDPOINT = "";
   et collez votre URL entre les guillemets :
        const LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfyc.../exec";

   Profitez-en pour mettre votre vrai numéro WhatsApp juste au-dessus :
        const WHATSAPP_NUMBER = "33600000000";   // votre numéro, sans + ni espaces

   ÉTAPE 6 — Tester
   ----------------
   1. Ouvrez le site, remplissez la pop-up ou le formulaire.
   2. Revenez sur le Google Sheet : une nouvelle ligne doit apparaître. ✅
   (Pour vérifier l'URL : collez-la dans un navigateur, vous devez voir
    le texte "Marbella OK".)

   ⚠️ Si plus tard vous modifiez ce script, refaites :
      Déployer ▸ Gérer les déploiements ▸ (crayon ✏️) ▸ Version : "Nouvelle"
      pour que les changements soient pris en compte (l'URL ne change pas).
   ====================================================================== */

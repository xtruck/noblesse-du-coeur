/* ⚙️ À compléter une seule fois : coller ici l'URL de l'application web Google Apps Script
   (Déployer → Nouveau déploiement → Application web → URL se terminant par /exec). */
const API_URL = "https://script.google.com/macros/s/AKfycbzu85-dWgiyb2qbYG___ppmWs8J636ElFowHnuH55uD8Cdnig4DNEExuJP2DnWncY_V/exec";

/* Liens vers les autres plateformes. Laisser vide ("") pour masquer un lien. */
const LIENS = {
  academie: "",   // POUR OUVRIR L'ACCÈS : mettre ici https://xtruck149.github.io/bmtacademy/formations/index.html (page « Toutes les formations »). Vide = bouton visible mais fermé (« bientôt »).
  ong: "ong.html",   // page de l'ONG Lueur d'Espoir, dans cette application (logo, présentation, contact, presse)
};

/* Revue de presse de l'ONG Lueur d'Espoir (page ong.html). Ajouter une ligne par article, par exemple :
   { t: "Titre de l'article", s: "Nom du journal", u: "https://adresse-de-l-article" }
   Laisser la liste vide pour masquer la section. */
const PRESSE = [];

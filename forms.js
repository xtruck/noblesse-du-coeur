/* Définition des formulaires — La Noblesse du Cœur (BMT Green Academy × ONG Lueur d'Espoir) */
const ECHELLE = ["Jamais", "Rarement", "Parfois", "Souvent", "Toujours"];
const ECHELLE2 = ["Très faible", "Faible", "Moyen", "Bon", "Excellent"];
const COMPETENCES = ["Gestion des émotions", "Respect des autres", "Communication", "Leadership positif"];
const INCIDENTS = ["Conflits entre élèves", "Bagarres", "Insultes / irrespect", "Sanctions disciplinaires"];
const IDENT = [
  { k: "etab", t: "text", l: "Établissement", req: true, half: true, list: "etabs" },
  { k: "classe", t: "text", l: "Classe", req: true, half: true, ph: "Ex. : 3e A, 2nde C, Tle D" },
];
const ELEVE = { k: "nom", t: "text", l: "Nom et prénoms de l'élève", req: true, help: "Écrire le nom exactement de la même façon sur tous les formulaires." };
const PHASE = { k: "phase", t: "radio", l: "Phase", req: true, opts: ["Avant le programme", "Après le programme"] };

const FORMS = {
  eval: {
    titre: "Évaluation personnelle de l'élève", court: "Évaluation élève", img: "savane", couleur: "#d9772b",
    desc: "À remplir AVANT puis APRÈS le programme, pour chaque élève (par l'élève ou par le responsable de classe d'après la fiche papier).",
    champs: [...IDENT, ELEVE, PHASE,
      { k: "q", t: "likert", l: "Mon comportement", req: true, scale: ECHELLE,
        rows: ["Je me mets facilement en colère.", "Je sais me calmer quand je suis énervé(e).", "Je respecte les autres (élèves, enseignants).",
               "Je règle mes conflits sans violence.", "Je réfléchis avant de parler.", "Je fais attention à ce que je publie sur les réseaux sociaux.",
               "Je suis un exemple positif pour les autres."] },
      { k: "mots", t: "textarea", l: "En quelques mots", help: "Avant : ce que l'élève attend du programme. Après : ce qui a changé pour lui." }],
  },
  ens: {
    titre: "Grille d'évaluation enseignant", court: "Grille enseignant", img: "hkb", couleur: "#14472f",
    desc: "Une grille par élève, remplie par l'enseignant AVANT puis APRÈS le programme.",
    champs: [...IDENT, ELEVE, { k: "enseignant", t: "text", l: "Nom de l'enseignant(e)", req: true }, PHASE,
      { k: "c", t: "likert", l: "Évaluation des comportements", req: true, scale: ECHELLE,
        rows: ["Respect des règles", "Gestion des conflits", "Comportement en classe", "Respect des camarades", "Maîtrise émotionnelle"] },
      { k: "obs", t: "textarea", l: "Observation de l'enseignant" }],
  },
  inc: {
    titre: "Registre des incidents", court: "Registre des incidents", img: "bassam", couleur: "#2f6fb0",
    desc: "Une réponse par classe : nombre d'incidents relevés AVANT et APRÈS le programme.",
    champs: [...IDENT, { k: "resp", t: "text", l: "Responsable", req: true, half: true }, { k: "periode", t: "text", l: "Période", half: true },
      { k: "inc", t: "incidents", l: "Nombre d'incidents", rows: INCIDENTS },
      { k: "obs", t: "textarea", l: "Observations" }],
  },
  suivi: {
    titre: "Fiche de suivi individuel", court: "Suivi individuel", img: "man", couleur: "#2e6b47",
    desc: "Une fiche par élève, remplie à la fin du programme par le responsable de classe.",
    champs: [...IDENT, ELEVE,
      { k: "d", t: "likert", l: "Compétences — DÉBUT du programme", req: true, scale: ECHELLE2, rows: COMPETENCES },
      { k: "f", t: "likert", l: "Compétences — FIN du programme", req: true, scale: ECHELLE2, rows: COMPETENCES },
      { k: "incident", t: "radio", l: "Incident disciplinaire majeur pendant le programme ?", req: true, opts: ["Non, aucun", "Oui"] },
      { k: "obs", t: "textarea", l: "Commentaires de l'enseignant / observations" },
      { k: "enseignant", t: "text", l: "Enseignant(e)" }],
  },
  rapport: {
    titre: "Rapport d'évaluation du programme", court: "Rapport établissement", img: "plateau", couleur: "#6d3f9a",
    desc: "Une réponse par établissement à la fin du programme. Les statistiques sont calculées automatiquement à partir des autres formulaires.",
    champs: [{ k: "etab", t: "text", l: "Établissement", req: true, list: "etabs" }, { k: "classes", t: "text", l: "Classe(s) / niveau(x)" },
      { k: "nb", t: "number", l: "Nombre d'élèves participants", req: true, half: true }, { k: "duree", t: "number", l: "Durée (jours)", half: true },
      { k: "debut", t: "date", l: "Date de début", half: true }, { k: "fin", t: "date", l: "Date de fin", half: true },
      { k: "retour", t: "textarea", l: "Retour des enseignants", req: true }, { k: "reco", t: "textarea", l: "Recommandations et perspectives" },
      { k: "resp", t: "text", l: "Responsable", req: true }],
  },
  ong: {
    titre: "Inscription des bénéficiaires", court: "ONG — Inscription", img: "bassam", couleur: "#2e7d4f", ong: true,
    desc: "Fiche individuelle du bénéficiaire de l'ONG Lueur d'Espoir. Les informations sont confidentielles et servent uniquement à l'accompagnement.",
    champs: [
      { t: "section", l: "1. Identité" },
      { k: "nom", t: "text", l: "Nom et prénoms", req: true }, { k: "naissance", t: "date", l: "Date de naissance", half: true },
      { k: "sexe", t: "radio", l: "Sexe", req: true, opts: ["Masculin", "Féminin"], half: true },
      { k: "tel", t: "tel", l: "Téléphone", req: true, half: true }, { k: "commune", t: "text", l: "Commune / quartier", req: true, half: true },
      { k: "contact", t: "text", l: "Personne à contacter (nom et téléphone)" },
      { t: "section", l: "2. Type de handicap" },
      { k: "handicap", t: "checks", l: "Type de handicap", req: true, opts: ["Moteur", "Visuel", "Auditif", "Mental / intellectuel", "Autre"] },
      { k: "desc", t: "textarea", l: "Description du handicap" },
      { k: "autonomie", t: "radio", l: "Niveau d'autonomie", opts: ["Faible", "Moyen", "Élevé"] },
      { k: "besoins_spec", t: "text", l: "Besoins spécifiques" },
      { t: "section", l: "3. Situation sociale" },
      { k: "famille", t: "text", l: "Situation familiale", half: true },
      { k: "etudes", t: "select", l: "Niveau d'études", half: true, opts: ["", "Aucun", "Primaire", "Secondaire", "Supérieur", "Formation professionnelle"] },
      { k: "activite", t: "text", l: "Activité", half: true }, { k: "revenus", t: "text", l: "Revenus (facultatif)", half: true },
      { k: "conditions", t: "textarea", l: "Conditions de vie" },
      { t: "section", l: "4. Besoins identifiés" },
      { k: "besoins", t: "checks", l: "Besoins identifiés", req: true, opts: ["Formation", "Soutien psychologique", "Insertion professionnelle", "Aide matérielle", "Autre"] },
      { k: "details", t: "textarea", l: "Détails des besoins" },
      { t: "section", l: "5. Consentement" },
      { k: "consent", t: "checks", l: "Consentement", req: true, opts: ["J'accepte que ces informations soient enregistrées et conservées de manière confidentielle par l'ONG Lueur d'Espoir, uniquement pour mon accompagnement."] },
      { k: "agent", t: "text", l: "Inscription faite par (nom de l'agent, si aidé)" }],
  },
};

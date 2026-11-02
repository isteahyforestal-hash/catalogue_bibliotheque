"use strict";

/* ===== Constantes, état et références DOM ===== */

const CLE_STOCKAGE = "isteah-log3550-livres";
const ANNEE_MIN = 1450;
const CHAMPS = ["titre", "auteur", "annee", "categorie"];

// État unique de l'application : l'affichage en est toujours dérivé.
const etat = {
  livres: [],
  recherche: "",
  categorie: "",
  dispoSeulement: false,
  tri: "titre-asc",
};

const $ = (selecteur) => document.querySelector(selecteur);

const el = {
  recherche: $("#recherche"),
  categorie: $("#filtre-categorie"),
  dispo: $("#filtre-dispo"),
  tri: $("#tri"),
  reinit: $("#btn-reinitialiser"),
  compteur: $("#compteur"),
  grille: $("#grille"),
  vide: $("#message-vide"),
  modele: $("#modele-carte"),
  formulaire: $("#form-ajout"),
  statut: $("#statut-formulaire"),
};

/* ===== Utilitaires ===== */

const anneeCourante = () => new Date().getFullYear();

const capitaliser = (texte) => texte.charAt(0).toUpperCase() + texte.slice(1);

const pluriel = (n, mot) => (n > 1 ? `${mot}s` : mot);

// Minuscules + suppression des accents : « Dézafi » devient « dezafi ».
function normaliser(texte) {
  return texte.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

const copierLivresDepart = () => LIVRES_DEPART.map((livre) => ({ ...livre }));

/* ===== Persistance (localStorage) ===== */

function chargerLivres() {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    const livres = brut ? JSON.parse(brut) : null;
    if (Array.isArray(livres)) return livres;
  } catch (erreur) {
    console.warn("Lecture du localStorage impossible :", erreur);
  }
  return copierLivresDepart();
}

function sauvegarderLivres() {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat.livres));
  } catch (erreur) {
    console.warn("Sauvegarde dans le localStorage impossible :", erreur);
  }
}

/* ===== Filtrage et tri (fonctions pures) ===== */

function filtrerLivres(livres, { recherche, categorie, dispoSeulement }) {
  const terme = normaliser(recherche.trim());
  return livres.filter(
    (livre) =>
      (!terme ||
        normaliser(livre.titre).includes(terme) ||
        normaliser(livre.auteur).includes(terme)) &&
      (!categorie || livre.categorie === categorie) &&
      (!dispoSeulement || livre.disponible)
  );
}

const COMPARATEURS = {
  "titre-asc": (a, b) => a.titre.localeCompare(b.titre, "fr", { sensitivity: "base" }),
  "titre-desc": (a, b) => COMPARATEURS["titre-asc"](b, a),
  "annee-asc": (a, b) => a.annee - b.annee,
  "annee-desc": (a, b) => b.annee - a.annee,
};

// On trie une copie pour ne pas modifier l'ordre de etat.livres.
const trierLivres = (livres, tri) => [...livres].sort(COMPARATEURS[tri]);

/* ===== Affichage ===== */

function creerCarte(livre) {
  const carte = el.modele.content.firstElementChild.cloneNode(true);
  const statut = livre.disponible ? "disponible" : "emprunté";

  carte.dataset.id = livre.id;
  carte.classList.add(livre.disponible ? "carte--disponible" : "carte--emprunte");

  // textContent (et non innerHTML) : un titre saisi ne peut pas injecter de HTML.
  carte.querySelector(".carte__titre").textContent = livre.titre;
  carte.querySelector(".carte__auteur").textContent = livre.auteur;
  carte.querySelector(".carte__meta").textContent =
    `${livre.annee} · ${capitaliser(livre.categorie)}`;

  const etiquette = carte.querySelector(".etiquette");
  etiquette.textContent = capitaliser(statut);
  etiquette.classList.add(livre.disponible ? "etiquette--disponible" : "etiquette--emprunte");

  const boutons = {
    emprunter: carte.querySelector('[data-action="emprunter"]'),
    retourner: carte.querySelector('[data-action="retourner"]'),
    supprimer: carte.querySelector('[data-action="supprimer"]'),
  };
  boutons.emprunter.disabled = !livre.disponible;
  boutons.retourner.disabled = livre.disponible;
  boutons.emprunter.setAttribute("aria-label", `Emprunter « ${livre.titre} »`);
  boutons.retourner.setAttribute("aria-label", `Retourner « ${livre.titre} »`);
  boutons.supprimer.setAttribute("aria-label", `Supprimer « ${livre.titre} »`);

  return carte;
}

function mettreAJourCompteur(nbVisibles) {
  const total = etat.livres.length;
  el.compteur.textContent =
    `${nbVisibles} ${pluriel(nbVisibles, "résultat")} sur ${total} ${pluriel(total, "livre")}`;
}

function mettreAJourMessageVide(nbVisibles) {
  el.vide.hidden = nbVisibles > 0;
  if (nbVisibles > 0) return;
  el.vide.textContent = etat.livres.length === 0
    ? "Le catalogue est vide. Ajoutez un livre ou cliquez sur « Réinitialiser »."
    : "Aucun livre ne correspond à votre recherche. Modifiez la recherche ou les filtres.";
}

function afficher() {
  const visibles = trierLivres(filtrerLivres(etat.livres, etat), etat.tri);
  el.grille.replaceChildren();
  visibles.forEach((livre) => el.grille.append(creerCarte(livre)));
  mettreAJourCompteur(visibles.length);
  mettreAJourMessageVide(visibles.length);
}

// Après un nouveau rendu, le bouton cliqué n'existe plus : on replace le focus clavier.
function redonnerFocus(id) {
  const cible = el.grille.querySelector(`[data-id="${id}"] button:not(:disabled)`);
  (cible || el.compteur).focus();
}

/* ===== Actions sur les livres ===== */

function changerDisponibilite(id, disponible) {
  const livre = etat.livres.find((l) => l.id === id);
  if (!livre) return;
  livre.disponible = disponible;
  sauvegarderLivres();
  afficher();
  redonnerFocus(id);
}

function supprimerLivre(id) {
  const livre = etat.livres.find((l) => l.id === id);
  if (!livre || !window.confirm(`Supprimer « ${livre.titre} » du catalogue ?`)) return;
  etat.livres = etat.livres.filter((l) => l.id !== id);
  sauvegarderLivres();
  afficher();
  el.compteur.focus();
}

function ajouterLivre(valeurs) {
  const id = Math.max(0, ...etat.livres.map((l) => l.id)) + 1;
  etat.livres.push({ id, ...valeurs });
  sauvegarderLivres();
  afficher();
}

function reinitialiserDonnees() {
  if (!window.confirm("Remettre les données de départ ? Vos ajouts et suppressions seront perdus.")) return;
  etat.livres = copierLivresDepart();
  sauvegarderLivres();
  afficher();
  el.compteur.focus();
}

/* ===== Formulaire : lecture, validation, erreurs ===== */

function lireFormulaire() {
  const champs = el.formulaire.elements;
  return {
    titre: champs.titre.value.trim(),
    auteur: champs.auteur.value.trim(),
    annee: Number(champs.annee.value),
    categorie: champs.categorie.value,
    disponible: champs.disponible.checked,
  };
}

// Retourne un objet { nomDuChamp: message } ; vide si tout est valide.
function validerFormulaire(valeurs) {
  const erreurs = {};
  const anneeMax = anneeCourante();

  if (valeurs.titre.length < 2) {
    erreurs.titre = "Le titre est obligatoire (2 caractères minimum).";
  }
  if (valeurs.auteur.length < 2) {
    erreurs.auteur = "L'auteur est obligatoire (2 caractères minimum).";
  }
  if (!Number.isInteger(valeurs.annee) || valeurs.annee < ANNEE_MIN || valeurs.annee > anneeMax) {
    erreurs.annee = `L'année doit être un nombre entier entre ${ANNEE_MIN} et ${anneeMax}.`;
  }
  if (!CATEGORIES.includes(valeurs.categorie)) {
    erreurs.categorie = "Choisissez une catégorie dans la liste.";
  }
  return erreurs;
}

function afficherErreur(nom, message) {
  $(`#erreur-${nom}`).textContent = message;
  el.formulaire.elements[nom].setAttribute("aria-invalid", message ? "true" : "false");
}

function afficherErreurs(erreurs) {
  CHAMPS.forEach((nom) => afficherErreur(nom, erreurs[nom] || ""));
  const premier = CHAMPS.find((nom) => erreurs[nom]);
  if (premier) el.formulaire.elements[premier].focus();
}

function soumettreFormulaire(evenement) {
  evenement.preventDefault();
  el.statut.textContent = "";

  const valeurs = lireFormulaire();
  const erreurs = validerFormulaire(valeurs);
  afficherErreurs(erreurs);
  if (Object.keys(erreurs).length > 0) return;

  ajouterLivre(valeurs);
  el.formulaire.reset();
  el.statut.textContent = `« ${valeurs.titre} » a été ajouté au catalogue.`;
}

/* ===== Initialisation ===== */

function creerOptions() {
  return CATEGORIES.map((categorie) => {
    const option = document.createElement("option");
    option.value = categorie;
    option.textContent = capitaliser(categorie);
    return option;
  });
}

const ACTIONS_CARTE = {
  emprunter: (id) => changerDisponibilite(id, false),
  retourner: (id) => changerDisponibilite(id, true),
  supprimer: supprimerLivre,
};

function brancherFiltres() {
  $("#form-filtres").addEventListener("submit", (e) => e.preventDefault());
  el.recherche.addEventListener("input", () => { etat.recherche = el.recherche.value; afficher(); });
  el.categorie.addEventListener("change", () => { etat.categorie = el.categorie.value; afficher(); });
  el.dispo.addEventListener("change", () => { etat.dispoSeulement = el.dispo.checked; afficher(); });
  el.tri.addEventListener("change", () => { etat.tri = el.tri.value; afficher(); });
  el.reinit.addEventListener("click", reinitialiserDonnees);
}

function brancherCartesEtFormulaire() {
  // Délégation d'événements : un seul écouteur pour tous les boutons des cartes.
  el.grille.addEventListener("click", (e) => {
    const bouton = e.target.closest("button[data-action]");
    if (!bouton) return;
    const id = Number(bouton.closest(".carte").dataset.id);
    ACTIONS_CARTE[bouton.dataset.action](id);
  });

  el.formulaire.addEventListener("submit", soumettreFormulaire);
  // Efface l'erreur d'un champ dès que l'utilisateur le corrige.
  el.formulaire.addEventListener("input", (e) => {
    if (CHAMPS.includes(e.target.name)) afficherErreur(e.target.name, "");
  });
}

function init() {
  el.categorie.append(...creerOptions());
  el.formulaire.elements.categorie.append(...creerOptions());

  const champAnnee = el.formulaire.elements.annee;
  champAnnee.min = ANNEE_MIN;
  champAnnee.max = anneeCourante();
  $("#aide-annee").textContent = `Entre ${ANNEE_MIN} et ${anneeCourante()}.`;

  etat.livres = chargerLivres();
  brancherFiltres();
  brancherCartesEtFormulaire();
  afficher();
}

init();

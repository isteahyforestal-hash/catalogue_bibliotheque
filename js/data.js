"use strict";

// Catégories autorisées (utilisées pour le filtre et le formulaire).
const CATEGORIES = ["roman", "science", "histoire", "informatique", "autre"];

// Données de départ, restaurées par le bouton « Réinitialiser ».
const LIVRES_DEPART = [
  { id: 1, titre: "Gouverneurs de la rosée", auteur: "Jacques Roumain", annee: 1944, categorie: "roman", disponible: true },
  { id: 2, titre: "Dézafi", auteur: "Frankétienne", annee: 1975, categorie: "roman", disponible: false },
  { id: 3, titre: "Amour, colère et folie", auteur: "Marie Vieux-Chauvet", annee: 1968, categorie: "roman", disponible: true },
  { id: 4, titre: "L'énigme du retour", auteur: "Dany Laferrière", annee: 2009, categorie: "roman", disponible: true },
  { id: 5, titre: "Ainsi parla l'oncle", auteur: "Jean Price-Mars", annee: 1928, categorie: "autre", disponible: false },
  { id: 6, titre: "Les Jacobins noirs", auteur: "C. L. R. James", annee: 1938, categorie: "histoire", disponible: true },
  { id: 7, titre: "Sapiens", auteur: "Yuval Noah Harari", annee: 2011, categorie: "histoire", disponible: true },
  { id: 8, titre: "Cosmos", auteur: "Carl Sagan", annee: 1980, categorie: "science", disponible: false },
  { id: 9, titre: "Une brève histoire du temps", auteur: "Stephen Hawking", annee: 1988, categorie: "science", disponible: true },
  { id: 10, titre: "Clean Code", auteur: "Robert C. Martin", annee: 2008, categorie: "informatique", disponible: true },
  { id: 11, titre: "The C Programming Language", auteur: "Brian Kernighan et Dennis Ritchie", annee: 1978, categorie: "informatique", disponible: false },
];

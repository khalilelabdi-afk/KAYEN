import type { SeedSynonym } from "../types";

/**
 * Synonymes de recherche : le terme saisi par le client est étendu aux variantes listées
 * (et inversement) pour retrouver les produits quel que soit le vocabulaire utilisé.
 */
export const synonyms: SeedSynonym[] = [
  { term: "gobelet", synonyms: ["verre jetable", "cup", "gobelet carton", "gobelet jetable", "verre en carton"] },
  { term: "essuie-mains", synonyms: ["essuie-tout", "papier mains", "essuie main", "serviette papier", "papier essuie-mains"] },
  { term: "bidon", synonyms: ["jerrican", "jerrycan", "bidon 5 l", "bidon 5 litres"] },
  { term: "nettoyant", synonyms: ["détergent", "produit de nettoyage", "produit ménager", "produit d'entretien", "lessive sol"] },
  { term: "haltère", synonyms: ["dumbbell", "haltere", "poids libre", "haltères"] },
  { term: "kettlebell", synonyms: ["poids russe", "girya", "kettle bell"] },
  { term: "papier toilette", synonyms: ["papier hygiénique", "papier wc", "rouleau toilette", "papier toilettes"] },
  { term: "sac poubelle", synonyms: ["sac à déchets", "sac ordures", "sac plastique poubelle", "sacs poubelles"] },
  { term: "désinfectant", synonyms: ["bactéricide", "virucide", "désinfection", "produit désinfectant", "desinfectant"] },
  { term: "gel hydroalcoolique", synonyms: ["gel hydro", "solution hydroalcoolique", "sha", "gel désinfectant mains", "gel hydro-alcoolique"] },
  { term: "carton", synonyms: ["caisse", "caisse américaine", "boîte carton", "carton d'expédition", "carton déménagement"] },
  { term: "film étirable", synonyms: ["film plastique", "film palette", "film d'emballage", "film étirable manuel"] },
  { term: "ruban adhésif", synonyms: ["adhésif", "ruban d'emballage", "bande adhésive", "rouleau adhésif", "ruban kraft"] },
  { term: "serviette", synonyms: ["serviette de table", "serviette papier", "serviette éponge", "serviette de toilette", "napkin"] },
  { term: "barquette", synonyms: ["bac alimentaire", "boîte repas", "contenant à emporter", "barquette alimentaire", "boîte à emporter"] },
  { term: "couvercle", synonyms: ["capuchon", "lid", "couvercle gobelet", "couvercle à boire"] },
  { term: "mop", synonyms: ["frange", "serpillère", "serpillière", "balai à franges", "balai plat"] },
  { term: "chiffon", synonyms: ["lavette", "microfibre", "chiffon microfibre", "torchon d'essuyage"] },
  { term: "drap", synonyms: ["drap plat", "drap housse", "linge de lit", "parure de lit", "literie"] },
  { term: "peignoir", synonyms: ["robe de chambre", "kimono", "sortie de bain", "peignoir de bain"] },
  { term: "tapis de sol", synonyms: ["tapis de yoga", "tapis fitness", "dalle caoutchouc", "sol sportif", "tapis de gym"] },
  { term: "ramette", synonyms: ["papier a4", "papier imprimante", "feuilles a4", "papier copieur", "ramette a4"] },
  { term: "toner", synonyms: ["cartouche", "cartouche d'encre", "consommable imprimante", "cartouche toner"] },
  { term: "gants", synonyms: ["gant nitrile", "gants jetables", "gants d'examen", "gants latex", "gants à usage unique"] },
  { term: "machine à café", synonyms: ["machine expresso", "cafetière professionnelle", "percolateur", "machine à expresso", "machine espresso"] },
];

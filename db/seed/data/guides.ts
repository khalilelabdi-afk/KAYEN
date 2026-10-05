import type { SeedGuide, SeedGuideCategory } from "../types";

/** Rubriques du blog / centre de conseils. */
export const guideCategories: SeedGuideCategory[] = [
  { slug: "approvisionnement", name: "Approvisionnement" },
  { slug: "restauration", name: "Restauration" },
  { slug: "hotellerie", name: "Hôtellerie" },
  { slug: "hygiene", name: "Hygiène & entretien" },
];

/** Guides d'achat rédigés pour les professionnels (contenu Markdown). */
export const guides: SeedGuide[] = [
  {
    slug: "comment-choisir-ses-emballages-professionnels",
    title: "Comment choisir ses emballages professionnels",
    excerpt:
      "Boîtes repas, gobelets, barquettes, caisses d'expédition : les critères qui comptent vraiment pour choisir un emballage adapté à vos produits, à votre volume et à votre organisation.",
    categorySlug: "approvisionnement",
    authorName: "Équipe KAYEN",
    readingMinutes: 5,
    relatedSkus: ["RES-BOX-KRAFT-1000-300", "RES-GOB-25CL-1000", "RES-BAR-BAG-650-500", "HYG-CAR-EXP-SC", "HYG-FILM-ETIR-17"],
    tone: "sand",
    pictogram: "box",
    publishedDaysAgo: 12,
    content: `Le mot « emballage » recouvre deux familles très différentes : les emballages alimentaires, qui accompagnent un plat ou une boisson jusqu'au client, et les emballages d'expédition, qui protègent une marchandise pendant le transport. Les critères de choix ne sont pas les mêmes, mais la méthode l'est : partir de l'usage réel, puis seulement regarder les matières et les prix.

## Partir de l'usage, pas du catalogue

Avant de comparer des références, répondez à quelques questions simples :

- Le contenu est-il chaud ou froid, gras, en sauce ou liquide ?
- Combien de temps s'écoule entre la mise en emballage et la consommation ?
- Le client va-t-il réchauffer le plat, et dans quel appareil ?
- L'emballage voyage-t-il à plat dans un sac, empilé dans une caisse de livraison, ou est-il consommé sur place ?
- Qui ferme l'emballage, et en combien de temps ? Un système à charnière se ferme d'une main ; un couvercle séparé demande un geste de plus.

Ces réponses éliminent la moitié des options et évitent l'erreur la plus courante : choisir un emballage sur son apparence, puis découvrir qu'il se ramollit, fuit ou ne passe pas au micro-ondes.

## Emballages alimentaires : ce que change la matière

**Le carton kraft** convient aux boîtes repas, aux boîtes burger et aux emballages de snacking. Il tient bien en main, accepte un marquage et donne un aspect sobre. Vérifiez la présence d'une doublure intérieure pour les plats en sauce : sans elle, le gras traverse en quelques minutes.

**La bagasse**, fibre issue de la canne à sucre, résiste au chaud et au gras, passe au micro-ondes et convient aux barquettes de plats cuisinés. Sa rigidité est bonne, mais elle n'est pas transparente : le client ne voit pas le contenu.

**Le PLA**, matière végétale transparente, est réservé aux boissons froides et aux salades. Il se déforme à la chaleur ; ne l'utilisez jamais pour un café ou une soupe.

**L'aluminium** reste la référence pour les plats à réchauffer au four, avec un couvercle carton ou aluminium. Il ne passe pas au micro-ondes.

**Le polypropylène (PP)** est le choix des barquettes réutilisables ou à usage multiple : il supporte le micro-ondes et la congélation, se ferme hermétiquement et existe en version compartimentée pour séparer un plat et son accompagnement.

Lorsque la mention « compostable » ou « recyclable » figure sur une fiche, elle s'applique dans des conditions précises (filière industrielle, tri séparé) : vérifiez qu'elles correspondent aux filières réellement disponibles chez vous avant d'en faire un argument commercial.

## Gobelets et couvercles : un accord à vérifier

Un gobelet se choisit avec son couvercle, jamais séparément. Le critère déterminant est le diamètre du bord : un couvercle 80 mm ne s'adapte qu'à un gobelet 80 mm, quelle que soit la contenance. Pour les boissons chaudes, la double paroi évite le manchon et protège les doigts ; pour l'expresso à emporter, un 12 cl suffit. Pour les boissons froides avec garniture, préférez un couvercle dôme avec croisillon.

Commandez de préférence gobelets et couvercles dans la même gamme : les tolérances de fabrication varient d'un fournisseur à l'autre et un couvercle « à peu près compatible » finit toujours par fuir.

## Emballages d'expédition : protéger sans surdimensionner

Pour les caisses carton, la question est la cannelure. Une simple cannelure suffit pour des produits légers ou déjà protégés ; une double cannelure s'impose au-delà d'une quinzaine de kilos, pour les objets fragiles ou les envois palettisés. Raisonnez en dimensions intérieures et prévoyez deux à trois centimètres de calage autour du produit.

Le calage (papier bulle, coussins d'air, papier kraft froissé) doit immobiliser le contenu, pas seulement remplir le vide. Pour les palettes, un film étirable manuel de 17 µ convient à la plupart des charges stables ; au-delà, passez à une épaisseur supérieure ou à un film machine. Terminez par un ruban adhésif adapté à la surface du carton : le ruban gommé kraft adhère mieux sur les cartons recyclés que le ruban polypropylène.

## Le bon conditionnement pour le bon volume

Les emballages se vendent au carton de plusieurs centaines d'unités. Avant de commander, mesurez la place disponible en réserve et estimez votre consommation hebdomadaire. Un conditionnement plus gros coûte moins cher à l'unité, mais immobilise de la trésorerie et de la surface. Le bon rythme se situe souvent entre une commande toutes les deux semaines et une commande mensuelle, en profitant des paliers de prix dégressifs sans dépasser un mois de stock.

## Check-list avant de commander

- L'emballage correspond-il à la température et à la texture du contenu ?
- Passe-t-il au micro-ondes ou au four si le client doit réchauffer ?
- Le couvercle est-il de la même gamme et du même diamètre ?
- Le carton d'expédition laisse-t-il la place au calage ?
- Le conditionnement tient-il dans votre réserve et correspond-il à un mois de consommation au plus ?
- Les mentions environnementales correspondent-elles aux filières de tri disponibles ?

Un dernier conseil : commandez un carton d'essai avant de fixer une référence sur la durée. Le test grandeur nature, avec vos plats et vos équipes, vaut mieux que n'importe quelle fiche technique.`,
  },
  {
    slug: "produits-indispensables-pour-ouvrir-un-cafe",
    title: "Produits indispensables pour ouvrir un café",
    excerpt:
      "Du poste café à la vente à emporter, en passant par la vaisselle et l'entretien : la liste des fournitures à prévoir avant l'ouverture, et comment organiser ses premières commandes.",
    categorySlug: "restauration",
    authorName: "Équipe KAYEN",
    readingMinutes: 6,
    relatedSkus: ["RES-MAC-EXP-1G", "RES-MOU-PRO-64", "RES-TAS-EXP-8-12", "RES-GOB-25CL-1000", "RES-BAR-PICHET-60"],
    tone: "clay",
    pictogram: "cup",
    publishedDaysAgo: 5,
    content: `Ouvrir un café, c'est d'abord une question d'emplacement et de carte. Mais le jour de l'ouverture, ce sont les fournitures qui font tourner le service : une tasse qui manque, un couvercle qui ne s'adapte pas ou un dégraissant oublié se paient immédiatement. Cette liste rassemble l'essentiel, poste par poste, pour une petite ou moyenne structure.

## Le poste café

C'est le cœur de l'activité, et le poste où l'investissement se concentre.

- **La machine expresso** : une machine 1 groupe suffit pour un débit modéré ou un espace de pause ; dès que le service connaît des pics (matin, sortie de bureaux), un 2 groupes permet à deux personnes de travailler en parallèle et offre une réserve de vapeur plus confortable.
- **Le moulin** : prévoyez un moulin professionnel dédié à l'expresso, avec des meules d'au moins 64 mm pour conserver une mouture régulière sur la journée. Un second moulin est utile si vous proposez un décaféiné ou un café filtre.
- **Les accessoires barista** : pichets à lait inox de 35 et 60 cl, tamper au diamètre de vos porte-filtres, tapis de tassage, brosse pour le groupe, balance et minuteur pour régler l'extraction.
- **L'entretien** : détartrant adapté à la machine, détergent pour les porte-filtres et le lait, chiffons microfibre réservés à la buse vapeur.

Pensez à la place nécessaire autour de la machine : un plan de travail dégagé de chaque côté, l'arrivée d'eau et l'évacuation, et un emplacement pour le moulin à portée de main.

## La vaisselle de service

Comptez deux à trois fois votre capacité d'assise pour chaque pièce en rotation, afin d'absorber les cycles du lave-vaisselle.

- Tasses expresso 8 cl avec soucoupes, tasses 18 à 25 cl pour les cafés allongés et cappuccinos, mugs ou bols selon votre carte.
- Verres à eau trempés : ils encaissent les chocs et les lavages répétés.
- Petites cuillères et couverts de table en inox 18/10 si vous servez à manger.
- Assiettes à dessert et assiettes plates en porcelaine renforcée, si la carte comporte des pâtisseries ou des plats du jour.
- Carafes en verre et plateaux de service antidérapants.

Choisissez des gammes qui restent disponibles dans la durée : vous recommanderez les pièces cassées pendant des années, et un mélange de modèles dépareillés se voit en salle.

## La vente à emporter

Même un café de quartier sert une part significative de boissons à emporter. Prévoyez :

- des gobelets 12 cl pour l'expresso, 25 cl pour les cafés longs et cappuccinos, 30 cl ou plus pour les boissons froides ;
- les couvercles au diamètre exact de chaque gobelet, commandés dans la même gamme ;
- des gobelets double paroi pour les boissons chaudes, ou des manchons si vous utilisez du simple paroi ;
- des touillettes, des serviettes 33 × 33 cm, des pailles papier pour le froid ;
- des sacs kraft à poignées et des boîtes pour les viennoiseries et sandwichs.

## Le petit matériel de bar et d'arrière-cuisine

Derrière le comptoir, quelques équipements évitent beaucoup d'allers-retours : bacs gastronormes avec couvercles pour le lait et les garnitures, boîtes de conservation graduées, planche à découper et couteaux pour les sandwichs, torchons en coton pour la plonge et pour le bar. Une poubelle à pédale et un bac à marc de café complètent le poste.

## Hygiène et entretien

Les produits d'entretien se commandent avant l'ouverture, en même temps que la vaisselle :

- dégraissant cuisine pour les plans de travail et le matériel ;
- désinfectant de surfaces pour les tables et le comptoir, en pulvérisateur prêt à l'emploi ;
- nettoyant sols neutre, mop plat et seau essoreur ;
- savon mains avec distributeur et essuie-mains pliés pour le poste de lavage et les sanitaires clients ;
- papier toilette, sacs poubelle 30 L et 50 L, gants nitrile ;
- produit de lavage vaisselle adapté à votre machine, et produit de rinçage.

Un code couleur simple pour les lavettes (une couleur pour le bar, une pour les tables, une pour les sanitaires) évite les contaminations croisées dès le premier jour.

## Organiser ses premières commandes

Distinguez la commande d'ouverture, volumineuse et ponctuelle, de la commande de réassort qui reviendra chaque semaine ou chaque quinzaine. La première comprend l'équipement durable (machine, moulin, vaisselle, mobilier) et un premier stock de consommables. La seconde ne contient que les consommables : gobelets, couvercles, serviettes, produits d'entretien, café.

Quelques réflexes utiles :

1. Commandez la vaisselle et la machine en premier, avec les délais de livraison les plus longs.
2. Testez un carton de chaque gobelet avec son couvercle avant de valider une quantité importante.
3. Créez une liste de réapprovisionnement avec les références validées : le réassort se fait ensuite en quelques minutes.
4. Visez les paliers de prix dégressifs sur les consommables à forte rotation, sans dépasser un mois de stock.
5. Gardez une marge de sécurité sur les produits critiques (couvercles, café, lait) : une rupture de couvercles bloque la vente à emporter.

Avec cette base, l'ouverture peut se concentrer sur ce qui compte vraiment : la qualité du café et l'accueil des premiers clients.`,
  },
  {
    slug: "check-list-equipement-hotel-chambre-salle-de-bain-accueil",
    title: "Check-list équipement hôtel : chambre, salle de bain, accueil",
    excerpt:
      "Comment calculer ses dotations de linge, choisir entre miniatures et distributeurs, et ne rien oublier dans l'équipement des chambres, des salles de bain et de l'accueil.",
    categorySlug: "hotellerie",
    authorName: "Équipe KAYEN",
    readingMinutes: 6,
    relatedSkus: ["HOT-DRA-PLAT-PERC", "HOT-SER-BAIN-50X100", "HOT-DIST-MURAL", "HOT-MINI-GEL-30ML", "HOT-CINTRES-ANTIVOL"],
    tone: "linen",
    pictogram: "bedding",
    publishedDaysAgo: 34,
    content: `Qu'il s'agisse d'une ouverture, d'une rénovation ou d'un simple renouvellement, l'équipement d'un hôtel se raisonne par zone et par rotation. Cette check-list suit le parcours du client, de la chambre à l'accueil, et s'accompagne de repères pour dimensionner les quantités.

## Avant de commencer : calculer les dotations

Pour le linge, la règle courante est de prévoir trois jeux par lit : un sur le lit, un au lavage, un en réserve. Si la blanchisserie est externalisée avec un délai de retour de plusieurs jours, passez à quatre jeux. Appliquez la même logique aux serviettes, en comptant par personne et non par chambre : une chambre double consomme deux serviettes de toilette et deux draps de bain par jour.

Pour les produits d'accueil et les consommables, partez du nombre de nuitées mensuelles et ajoutez une marge de sécurité d'une à deux semaines.

## La chambre

**Le linge de lit**

- Draps plats ou draps-housses selon vos pratiques d'étage, en percale de coton pour un toucher frais et une bonne tenue au lavage, ou en satin de coton pour une finition plus douce.
- Taies d'oreiller avec rabat, dans la même qualité que les draps.
- Housses de couette et couettes tempérées, lavables en blanchisserie ; prévoyez une couette d'appoint par chambre pour l'hiver si l'établissement n'est pas chauffé uniformément.
- Oreillers : la microfibre lavable à 60 °C simplifie l'entretien ; les plumettes et duvet offrent un confort supérieur mais demandent un nettoyage spécifique. Proposer les deux en « menu d'oreillers » est une attention appréciée.
- Protège-matelas et protège-oreillers, indispensables pour prolonger la durée de vie de la literie.

**L'équipement**

- Cintres antivol à tête fixe, en nombre suffisant (six à huit par chambre).
- Plateau de courtoisie avec bouilloire, tasses et boîte à sachets.
- Mini-réfrigérateur silencieux si la catégorie de l'établissement le justifie.
- Panneau « Ne pas déranger », porte-bagages, corbeille à papier, lampe de chevet.

## La salle de bain

**Le linge de toilette**

- Serviettes de toilette 50 × 100 cm et draps de bain 70 × 140 cm, en éponge de 500 à 550 g/m² : un bon compromis entre moelleux, absorption et temps de séchage.
- Tapis de bain éponge, plus lourd, pour l'antidérapant et l'absorption.
- Peignoirs et chaussons selon la gamme : éponge pour les établissements qui mettent l'accent sur le bien-être, nid d'abeille plus léger et plus rapide à sécher pour les autres.

**Les produits d'accueil**

Deux approches coexistent. Les miniatures (gel douche, shampoing, savonnette) sont simples à mettre en place et donnent une image de soin ; elles génèrent du déchet et un coût par nuitée. Les distributeurs muraux rechargeables réduisent les déchets et le coût, mais demandent un réassort rigoureux et un contrôle du niveau à chaque recouche. Beaucoup d'établissements combinent les deux : distributeurs dans la douche, savonnette et kit dentaire au lavabo.

**Les équipements**

- Sèche-cheveux mural avec arrêt automatique.
- Distributeur de savon au lavabo, porte-serviettes et patères en nombre suffisant.
- Poubelle de salle de bain, brosse WC, papier toilette de qualité avec réserve visible.

## L'accueil et les parties communes

- Mobilier d'accueil et de salle de petit-déjeuner adapté à un usage intensif.
- Porte-parapluies, présentoirs à documentation, signalétique intérieure.
- Vaisselle de petit-déjeuner : tasses, verres, assiettes, couverts, en quantité suffisante pour un service continu sans attendre le lave-vaisselle.
- Produits d'entretien des parties communes : nettoyant sols, nettoyant vitres, désinfectant de surfaces.

## L'office d'étage et l'entretien

L'équipe d'étage a besoin d'un poste bien organisé :

- un chariot de ménage par étage ou par femme de chambre, avec sac à linge et compartiments pour les produits ;
- nettoyant sols, nettoyant sanitaires, désinfectant de surfaces, nettoyant vitres, en bidons de 5 L avec doseurs ;
- lavettes microfibre à code couleur (sanitaires, surfaces, vitres) ;
- gants nitrile, sacs poubelle 30 L pour les corbeilles et 110 L pour la collecte ;
- essuie-mains et savon pour l'office lui-même.

## Check-list récapitulative

**Chambre** : draps, taies, housses de couette, couettes, oreillers, protège-matelas, cintres, plateau de courtoisie, bouilloire, panneau de porte, corbeille.

**Salle de bain** : serviettes, draps de bain, tapis de bain, peignoirs, chaussons, produits d'accueil (miniatures ou distributeurs et recharges), kits de courtoisie, sèche-cheveux, distributeur de savon, papier toilette.

**Accueil** : mobilier, signalétique, vaisselle de petit-déjeuner, produits d'entretien des parties communes.

**Office** : chariot de ménage, produits d'entretien, lavettes, gants, sacs poubelle.

Prenez le temps de tester un jeu de linge complet en conditions réelles (lavage, séchage, repassage) avant de passer la commande de dotation : la tenue au lavage se juge sur plusieurs cycles, pas au déballage.`,
  },
  {
    slug: "comment-reduire-le-cout-de-ses-consommables",
    title: "Comment réduire le coût de ses consommables",
    excerpt:
      "Coût à l'usage, standardisation, paliers de prix, dosage et suivi de consommation : des leviers concrets pour faire baisser la facture de consommables sans dégrader la qualité.",
    categorySlug: "approvisionnement",
    authorName: "Équipe KAYEN",
    readingMinutes: 5,
    relatedSkus: ["HYG-NET-SOL-5L", "HYG-ESS-MAIN-Z-3000", "HYG-SAV-CART-1L", "BUR-RAM-A4-BLC", "HYG-SAC-POUB-50L"],
    tone: "stone",
    pictogram: "scale",
    publishedDaysAgo: 61,
    content: `Les consommables (produits d'entretien, papier, gobelets, sacs, fournitures de bureau) pèsent peu individuellement, mais leur addition sur une année devient un poste à part entière. La bonne nouvelle : ce poste se pilote avec des outils simples, sans renégocier chaque référence.

## Raisonner en coût à l'usage, pas en prix unitaire

Le prix affiché d'un produit dit peu de chose sur ce qu'il coûte réellement. Un nettoyant concentré à 5 L paraît plus cher qu'un pulvérisateur prêt à l'emploi, mais il prépare des dizaines de seaux. Pour comparer, ramenez toujours au coût d'une utilisation :

- pour un produit concentré, divisez le prix du bidon par le nombre de dilutions qu'il permet au dosage recommandé ;
- pour le papier, comparez le prix par feuille ou par mètre, et non par carton ;
- pour les gobelets et couvercles, calculez le prix par boisson servie, couvercle compris.

Ce calcul fait souvent apparaître que le produit le moins cher au catalogue n'est pas le moins cher à l'usage, et inversement.

## Standardiser les références

Les doublons coûtent cher : deux nettoyants pour le même usage, trois formats de gobelets, des gants de plusieurs tailles mal réparties. Chaque référence supplémentaire multiplie les stocks minimums, complique la formation des équipes et fait rater des paliers de prix.

Passez en revue vos achats des derniers mois et regroupez-les par usage. Visez une référence par usage, deux au maximum lorsque les contraintes l'imposent (un format pour les sanitaires clients, un autre pour les locaux techniques, par exemple). Une gamme courte est aussi plus simple à recommander.

## Jouer les paliers, sans surstocker

Les tarifs dégressifs récompensent la quantité, mais le stock a un coût : surface occupée, trésorerie immobilisée, risque de péremption ou de détérioration. La bonne pratique consiste à regrouper les commandes pour atteindre un palier sur les références à forte rotation, en se limitant à un mois de consommation.

Un rythme régulier (une commande par quinzaine ou par mois) facilite ce regroupement. Les commandes passées dans l'urgence, en petite quantité et avec des frais de port, sont celles qui dégradent le plus le coût moyen.

## Contrôler le dosage et la distribution

La surconsommation est le gisement d'économies le plus souvent négligé. Quelques exemples :

- un produit concentré dosé « à l'œil » est fréquemment utilisé à deux ou trois fois le dosage recommandé, sans gain d'efficacité ; un bouchon doseur ou une pompe doseuse règle le problème ;
- un distributeur d'essuie-mains feuille à feuille limite la prise par rapport à un rouleau libre ;
- une cartouche de savon avec distributeur mural dose une quantité constante, là qu'un flacon pompe laissé sur le lavabo est pressé plusieurs fois ;
- des sacs poubelle correctement dimensionnés évitent de changer un sac à moitié vide.

Le matériel de distribution se rentabilise rapidement lorsqu'il réduit la quantité prélevée à chaque geste.

## Suivre la consommation

Sans mesure, impossible de savoir si une action a porté ses fruits. Mettez en place un suivi simple :

1. Relevez chaque mois les quantités sorties du stock pour les dix références les plus consommées.
2. Rapportez-les à un indicateur d'activité : nombre de couverts, de nuitées, de passages ou de postes de travail.
3. Comparez d'un mois sur l'autre et d'un site à l'autre si vous en gérez plusieurs.

Une dérive soudaine signale un problème (fuite, gaspillage, changement de pratique) ; une baisse régulière valide les actions engagées.

## Choisir des produits durables lorsque c'est pertinent

Le réutilisable n'est pas toujours la meilleure option, mais il l'est souvent : lavettes microfibre lavables plutôt que chiffons jetables, mop plat à housses lavables plutôt que franges à usage unique, gourdes ou carafes plutôt que bouteilles. Conservez le jetable là où l'hygiène l'impose (gants, essuie-mains dans les sanitaires, certains consommables de soin) et évaluez le reste au cas par cas, en incluant le coût de lavage dans le calcul.

## Mettre en place un réassort régulier

Une fois les références standardisées et les dosages contrôlés, transformez vos achats en routine :

- une liste de réapprovisionnement par site ou par service, avec les quantités types ;
- un responsable identifié pour chaque liste ;
- un stock de sécurité défini pour les références critiques ;
- une date fixe de commande, pour regrouper les besoins et atteindre les paliers.

Cette organisation prend quelques heures à mettre en place et fait gagner du temps à chaque commande. Elle réduit aussi les commandes d'urgence, qui sont presque toujours les plus coûteuses.`,
  },
  {
    slug: "bien-choisir-ses-produits-d-entretien-professionnels",
    title: "Bien choisir ses produits d'entretien professionnels",
    excerpt:
      "Nettoyer, dégraisser, désinfecter, détartrer : comprendre les familles de produits, lire le pH et la concentration, et composer une gamme courte et sûre pour vos équipes.",
    categorySlug: "hygiene",
    authorName: "Équipe KAYEN",
    readingMinutes: 6,
    relatedSkus: ["HYG-NET-SOL-5L", "HYG-DEG-CUIS-5L", "HYG-DES-SURF-5L", "HYG-NET-VIT-5L", "HYG-MOP-PLAT-40"],
    tone: "sage",
    pictogram: "spray",
    publishedDaysAgo: 88,
    content: `Un rayon de produits d'entretien professionnels peut dérouter : des dizaines de bidons, des promesses voisines, des pictogrammes de danger. En réalité, quatre familles de produits couvrent presque tous les besoins d'un établissement. Les connaître permet de composer une gamme courte, efficace et sûre.

## Nettoyer, dégraisser, désinfecter, détartrer : quatre actions différentes

- **Nettoyer** consiste à retirer les salissures courantes (poussière, traces, résidus). C'est le rôle du nettoyant neutre, utilisé au quotidien sur les sols et les surfaces.
- **Dégraisser** vise les graisses cuites ou accumulées, en cuisine ou en atelier. Le dégraissant est alcalin : il dissout la graisse là où un nettoyant neutre l'étale.
- **Désinfecter** réduit la population de micro-organismes sur une surface préalablement nettoyée. Un désinfectant ne nettoie pas : sur une surface sale, son action est très réduite.
- **Détartrer** élimine le calcaire des sanitaires, des machines et des surfaces exposées à l'eau. Le détartrant est acide.

Beaucoup d'erreurs viennent de la confusion entre ces actions : désinfecter une table grasse sans l'avoir dégraissée, ou utiliser un détartrant acide sur un sol protégé qu'il va abîmer.

## Lire le pH et la concentration

Le pH indique la nature du produit : neutre autour de 7, alcalin au-dessus, acide en dessous. Il renseigne directement sur l'usage et sur les supports compatibles. Un sol protégé par une émulsion demande un pH neutre ; les graisses de cuisine demandent un pH alcalin ; le calcaire demande un pH acide.

La concentration distingue les produits concentrés, à diluer, des produits prêts à l'emploi. Le concentré est plus économique et prend moins de place, à condition de respecter le dosage : un bouchon doseur ou une pompe sont indispensables. Le prêt à l'emploi, en pulvérisateur, convient aux interventions ponctuelles et aux équipes nombreuses où le dosage est difficile à contrôler.

## Adapter le produit au support

Avant d'étendre un produit à tout un établissement, vérifiez sa compatibilité avec les matériaux présents :

- carrelage et grès : la plupart des produits conviennent, attention aux joints avec les acides ;
- PVC, linoléum et sols protégés : nettoyant neutre uniquement ;
- bois et stratifié : produits doux, peu d'eau ;
- inox : dégraissant puis rinçage, jamais de produit chloré prolongé ;
- verre et surfaces brillantes : nettoyant vitres sans résidu ;
- surfaces en contact avec les aliments : produits adaptés au contact alimentaire, avec rinçage à l'eau potable après désinfection si la fiche le demande.

En cas de doute, testez sur une zone peu visible et attendez le séchage complet avant de juger.

## Une gamme courte et un code couleur

Quatre à cinq produits suffisent à la majorité des établissements : un nettoyant sols neutre, un nettoyant multi-surfaces ou vitres, un dégraissant, un désinfectant de surfaces, un détartrant sanitaire. Chaque produit supplémentaire doit répondre à un besoin que la gamme de base ne couvre pas.

Associez cette gamme à un code couleur pour les lavettes et les seaux, par exemple rouge pour les sanitaires, bleu pour les surfaces, vert pour la cuisine, jaune pour les zones de soin ou d'accueil. Étiquetez les pulvérisateurs remplis à partir d'un concentré avec le nom du produit et la dilution. Ces deux habitudes réduisent les erreurs de manipulation et les contaminations croisées.

## Sécurité et bonnes pratiques

Les produits professionnels sont plus concentrés que leurs équivalents grand public et demandent quelques règles strictes :

- lire la fiche de données de sécurité et la fiche technique de chaque produit, et les tenir à disposition des équipes ;
- porter des gants et, pour les produits alcalins ou acides concentrés, des lunettes de protection lors du dosage ;
- ne jamais mélanger deux produits, en particulier un désinfectant chloré et un acide ;
- stocker les bidons fermés, à l'écart des denrées alimentaires, dans un local ventilé et hors de portée du public ;
- respecter le temps de contact indiqué pour les désinfectants, qui conditionne leur efficacité.

## Le matériel compte autant que le produit

Le meilleur nettoyant donne un résultat médiocre avec un matériel inadapté. Un mop plat en microfibre avec seau essoreur nettoie plus vite et avec moins d'eau qu'une frange classique ; des chiffons microfibre lavables remplacent avantageusement les chiffons jetables sur les surfaces ; un balai adapté au sol (coco pour l'extérieur, fibres souples pour l'intérieur) évite de déplacer la poussière. Un chariot de ménage bien organisé fait gagner du temps à chaque tournée.

## Check-list pour composer sa gamme

1. Lister les surfaces et matériaux à entretenir, zone par zone.
2. Attribuer à chaque zone l'action nécessaire : nettoyer, dégraisser, désinfecter, détartrer.
3. Choisir un produit par action, en vérifiant la compatibilité avec les supports.
4. Préférer les concentrés avec doseur pour les usages quotidiens, le prêt à l'emploi pour le ponctuel.
5. Mettre en place le code couleur, l'étiquetage et les fiches de sécurité.
6. Compléter avec le matériel : mop, seau, chiffons, gants, chariot.

Revoyez la gamme une fois par an : un produit ajouté « en attendant » a tendance à rester, et c'est souvent lui qui fait doublon.`,
  },
  {
    slug: "equiper-une-petite-salle-de-sport-les-essentiels",
    title: "Équiper une petite salle de sport : les essentiels",
    excerpt:
      "Sol, poids libres, petit matériel, hygiène et vestiaires : par quoi commencer et comment prioriser le budget pour équiper un studio ou une petite salle de sport.",
    categorySlug: "approvisionnement",
    authorName: "Équipe KAYEN",
    readingMinutes: 6,
    relatedSkus: ["FIT-HAL-HEX", "FIT-KET-FON", "FIT-DAL-CAOU-20MM", "FIT-BAN-MUS-REG", "FIT-LIN-DES-800"],
    tone: "slate",
    pictogram: "dumbbell",
    publishedDaysAgo: 117,
    content: `Une petite salle de sport, un studio de coaching ou une salle d'entreprise n'ont pas besoin de dizaines de machines pour proposer des séances complètes. L'essentiel tient en quelques familles d'équipement, à condition de bien les dimensionner. Voici par quoi commencer, dans l'ordre où les décisions s'enchaînent.

## Commencer par le sol

Le sol est le premier achat, parce qu'il conditionne tout le reste : il protège la dalle du bâtiment, amortit les chutes de charges et réduit le bruit.

- **Zone poids libres** : dalles caoutchouc de 20 mm d'épaisseur, posées sur une surface plane. C'est l'épaisseur qui permet de reposer des haltères et des kettlebells sans dégrader le sol ni les équipements.
- **Zones cardio et entraînement fonctionnel** : rouleau de caoutchouc de 8 mm, plus économique au mètre carré, suffisant pour les exercices au poids du corps et les appareils.
- **Zone étirements et cours** : tapis de yoga de 6 mm, faciles à nettoyer et à ranger.

Mesurez précisément chaque zone avant de commander, et prévoyez une marge pour les coupes. Vérifiez auprès du propriétaire ou d'un bureau d'études la charge admissible du plancher si la salle n'est pas au rez-de-chaussée.

## Le poids libre : la base d'une petite salle

Pour un investissement raisonnable, le poids libre offre le plus de variété d'exercices.

- **Haltères hexagonaux** : la forme hexagonale évite qu'ils roulent et permet des exercices au sol. Une gamme de 2 à 30 kg par paires, avec un pas de 2 kg jusqu'à 10 kg puis de 2,5 à 5 kg au-delà, couvre les besoins de la plupart des pratiquants. Un rack à trois niveaux les range et libère le sol.
- **Kettlebells** : trois à cinq poids entre 8 et 24 kg suffisent pour démarrer ; la fonte peinte avec poignée lisse est un bon choix pour un usage collectif.
- **Banc réglable** : un banc à plusieurs positions (plat, incliné, décliné) multiplie les exercices possibles avec les haltères.
- **Barre et disques** si la place et le budget le permettent, avec un rack ou une cage pour sécuriser le squat et le développé.

Choisissez des revêtements caoutchouc sur les haltères et les disques : ils résistent mieux à l'usage collectif et ménagent le sol.

## Le petit matériel fonctionnel

Peu coûteux et peu encombrant, il permet d'animer des cours et de varier les séances :

- mini bandes élastiques et bandes de traction de différentes résistances ;
- slam balls et médecine balls, ballons de gym anti-éclatement ;
- cordes à sauter à câble, réglables ;
- rangement mural ou chariot pour que le matériel soit rangé après chaque séance.

Commandez ces articles par lots : le prix unitaire baisse, et un stock de remplacement évite de retirer un exercice du programme quand une bande casse.

## L'hygiène, un argument commercial

La propreté des équipements est l'un des premiers critères de fidélisation. Prévoyez dès l'ouverture :

- des lingettes désinfectantes en seau distributeur, placées à plusieurs endroits de la salle ;
- un nettoyant pour équipements sportifs en pulvérisateur, pour le nettoyage par l'équipe ;
- des serviettes microfibre à prêter ou à vendre, et des serviettes de douche pour les vestiaires ;
- un distributeur de gel hydroalcoolique à l'entrée ;
- des poubelles à pédale et des sacs adaptés.

Affichez des consignes simples : essuyer après usage, reposer le matériel, utiliser une serviette sur les bancs. Un nettoyage quotidien du sol avec un produit adapté au caoutchouc complète le dispositif.

## Les vestiaires

- Casiers en acier à serrure à code ou à cadenas, en nombre proportionnel à la fréquentation attendue aux heures de pointe.
- Bancs de vestiaire à lattes bois, résistants à l'humidité.
- Patères, miroirs, sèche-cheveux dans les espaces douche.
- Tapis antidérapants dans les zones humides, nettoyant sanitaires et distributeur de savon.
- Fontaine à eau et, si vous le souhaitez, gourdes réutilisables à l'enseigne de la salle.

## Planifier le budget et le réassort

Répartissez le budget en trois blocs : le sol et le poids libre (investissement durable, à faire correctement dès le départ), le petit matériel (renouvelé régulièrement) et les consommables d'hygiène (achetés en continu).

Quelques repères :

1. Ne sous-dimensionnez pas le sol pour financer plus de matériel : un sol insuffisant se remplace, avec une fermeture temporaire.
2. Préférez quelques équipements de qualité adaptés à un usage collectif à un grand nombre de références fragiles.
3. Profitez des tarifs dégressifs sur les paires d'haltères et les lots de petit matériel.
4. Créez une liste de réapprovisionnement pour les consommables d'hygiène dès le premier mois.
5. Gardez une partie du budget pour les demandes des adhérents : les premiers mois révèlent ce qui manque réellement.

Avec un sol adapté, une gamme de poids libres cohérente, du petit matériel en quantité et une hygiène visible, une petite salle propose déjà des séances complètes et donne envie de revenir.`,
  },
];

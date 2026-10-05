import type { SeedSector } from "../types";

/** Secteurs d'activité (pages d'entrée par métier). */
export const sectors: SeedSector[] = [
  {
    slug: "cafe-restaurant",
    name: "Café & Restaurant",
    heroTitle: "Équipez votre restaurant, de la cuisine à la salle.",
    heroSubtitle:
      "Vaisselle, emballages à emporter, ustensiles, machines à café et produits d'entretien, livrés directement à l'établissement.",
    description:
      "Cafés, brasseries, restaurants et traiteurs trouvent ici les fournitures du quotidien : assiettes et verres résistants au lave-vaisselle, gobelets et boîtes pour la vente à emporter, matériel de préparation et entretien des cuisines. Les tarifs dégressifs s'appliquent dès les premiers cartons, et les références récurrentes se recommandent en quelques clics.",
    icon: "coffee",
    categorySlugs: [
      "restauration",
      "vaisselle",
      "emballages-alimentaires",
      "ustensiles",
      "machines-cafe",
      "nettoyants",
      "lavage-vaisselle",
      "mobilier",
    ],
    featuredSkus: [
      "RES-GOB-25CL-1000",
      "RES-BOX-KRAFT-1000-300",
      "RES-ASS-PLATE-27-6",
      "RES-VER-EAU-25-24",
      "RES-CVT-TABLE-12",
      "RES-GN-INOX-11",
      "RES-MAC-EXP-2G",
      "HYG-DEG-CUIS-5L",
    ],
    seoTitle: "Fournitures pour cafés et restaurants | KAYEN",
    seoDescription:
      "Vaisselle, emballages alimentaires, ustensiles, machines à café et entretien pour cafés et restaurants. Prix professionnels dégressifs, livraison rapide.",
  },
  {
    slug: "hotel",
    name: "Hôtel",
    heroTitle: "Le confort de vos chambres, livré en quantité.",
    heroSubtitle:
      "Linge, produits d'accueil, équipement de chambre et consommables d'entretien pour hôtels, résidences et chambres d'hôtes.",
    description:
      "Des draps aux miniatures cosmétiques, en passant par les distributeurs de salle de bain et le petit-déjeuner, cette sélection couvre les besoins d'un établissement hôtelier. Les gammes sont choisies pour supporter les lavages répétés et rester disponibles d'une commande à l'autre.",
    icon: "bed",
    categorySlugs: [
      "hotellerie",
      "linge",
      "produits-accueil",
      "salle-de-bain",
      "chambre",
      "petit-dejeuner",
      "papier",
      "nettoyants",
    ],
    featuredSkus: [
      "HOT-SER-BAIN-50X100",
      "HOT-TAIE-PERC-65",
      "HOT-DRA-PLAT-PERC",
      "HOT-MINI-GEL-30ML",
      "HOT-SAVONNETTE-20G",
      "HOT-CHAUSSONS-EPONGE",
      "HOT-RECH-GEL-5L",
      "HOT-CINTRES-ANTIVOL",
    ],
    seoTitle: "Fournitures et équipement pour hôtels | KAYEN",
    seoDescription:
      "Linge d'hôtel, produits d'accueil, salle de bain, équipement de chambre et entretien pour hôtels et résidences. Tarifs professionnels, réassort facile.",
  },
  {
    slug: "salle-de-sport",
    name: "Salle de sport",
    heroTitle: "Du plateau de musculation aux vestiaires.",
    heroSubtitle:
      "Poids libres, accessoires, désinfection des équipements et rangement pour les salles de sport, studios et clubs.",
    description:
      "Haltères, kettlebells, tapis, élastiques et bancs côtoient les produits d'entretien adaptés aux surfaces sportives et aux équipements partagés. Les casiers, bancs de vestiaire et fontaines à eau complètent l'aménagement d'une salle accueillant du public.",
    icon: "dumbbell",
    categorySlugs: [
      "fitness",
      "equipement-fitness",
      "accessoires-fitness",
      "entretien-fitness",
      "vestiaires",
      "hydratation",
      "desinfectants",
    ],
    featuredSkus: [
      "FIT-HAL-HEX",
      "FIT-KET-FON",
      "FIT-TAP-YOGA-6MM",
      "FIT-DAL-CAOU-20MM",
      "FIT-LIN-DES-800",
      "FIT-ELA-MINI-LOT5",
      "FIT-CAS-VES-4P",
      "FIT-GOU-TRI-750-24",
    ],
    seoTitle: "Équipement pour salles de sport et studios | KAYEN",
    seoDescription:
      "Matériel de musculation, accessoires fitness, entretien des équipements, vestiaires et hydratation pour salles de sport. Prix dégressifs pour les professionnels.",
  },
  {
    slug: "bureau",
    name: "Bureau",
    heroTitle: "Tout ce qu'il faut pour faire tourner le bureau.",
    heroSubtitle:
      "Papeterie, impression, mobilier, informatique et pause café regroupés chez un seul fournisseur.",
    description:
      "Cette sélection s'adresse aux entreprises, cabinets et administrations qui veulent centraliser leurs achats de fournitures. Les consommables se commandent par carton, le mobilier et les périphériques sont livrés à l'étage, et l'historique de commande facilite les réassorts.",
    icon: "briefcase",
    categorySlugs: [
      "bureau",
      "papeterie",
      "rangement",
      "mobilier-bureau",
      "informatique",
      "pause-cafe",
      "impression",
      "papier",
    ],
    featuredSkus: [
      "BUR-RAM-A4-BLC",
      "BUR-STY-BIL-50",
      "BUR-CLA-LEV-80-10",
      "BUR-NOT-REP-76-12",
      "BUR-SIE-ERG-MESH",
      "BUR-ECR-27-FHD",
      "BUR-CAP-CAF-100",
      "BUR-TON-NOIR-3K",
    ],
    seoTitle: "Fournitures et mobilier de bureau pour entreprises | KAYEN",
    seoDescription:
      "Papeterie, classement, mobilier, informatique, impression et pause café pour les bureaux. Achats centralisés, prix professionnels et livraison rapide.",
  },
  {
    slug: "commerce",
    name: "Commerce",
    heroTitle: "Emballez, expédiez, présentez.",
    heroSubtitle:
      "Cartons, sacs, étiquettes, rubans adhésifs et rayonnages pour les boutiques, les ateliers et la vente en ligne.",
    description:
      "Boutiques, e-commerçants et ateliers trouvent ici de quoi préparer et expédier leurs commandes : caisses carton en plusieurs formats, films et calage, sacs kraft, étiquettes et fournitures d'expédition. Les rayonnages et la signalisation complètent l'aménagement de la réserve et du point de vente.",
    icon: "store",
    categorySlugs: [
      "emballage",
      "cartons",
      "sacs",
      "etiquettes",
      "rubans-adhesifs",
      "expedition",
      "rangement-et-etageres",
      "securite",
    ],
    featuredSkus: [
      "HYG-CAR-EXP-SC",
      "HYG-CAR-EXP-DC-60",
      "HYG-FILM-ETIR-17",
      "HYG-BULLE-ROUL-100",
      "HYG-RUB-ADH-PP-36",
      "HYG-ETIQ-THERM-500",
      "HYG-RUB-KRAFT-6",
      "BUR-EXT-ABC-6KG",
    ],
    seoTitle: "Emballage et fournitures pour commerces | KAYEN",
    seoDescription:
      "Cartons, films, sacs, étiquettes, rubans adhésifs et rayonnages pour les commerces et la vente en ligne. Conditionnements professionnels à prix dégressifs.",
  },
  {
    slug: "beaute-spa",
    name: "Beauté & Spa",
    heroTitle: "Une cabine impeccable, à chaque rendez-vous.",
    heroSubtitle:
      "Linge, consommables à usage unique, équipement de cabine et produits d'ambiance pour instituts, spas et salons.",
    description:
      "Serviettes et draps de massage, consommables d'épilation et de manucure, tables et tabourets de cabine, huiles et diffuseurs : la sélection couvre l'activité quotidienne d'un institut ou d'un spa. Les produits d'hygiène de cabine et les savons complètent l'ensemble.",
    icon: "sparkles",
    categorySlugs: [
      "beaute-spa",
      "linge-spa",
      "consommables-beaute",
      "equipement-cabine",
      "hygiene-cabine",
      "ambiance-spa",
      "savons",
    ],
    featuredSkus: [
      "SPA-SER-COT-50X90-12",
      "SPA-DRA-MAS-NT-100",
      "SPA-SER-JET-40X80-100",
      "SPA-PEI-KIM-EPO",
      "SPA-HUI-NEU-1L",
      "SPA-HUI-AGR-5L",
      "HYG-SAV-MAIN-5L",
      "HYG-GEL-HYDRO-500",
    ],
    seoTitle: "Fournitures pour instituts de beauté et spas | KAYEN",
    seoDescription:
      "Linge de cabine, consommables beauté, tables de massage, hygiène et produits d'ambiance pour instituts et spas. Tarifs professionnels, réassort simple.",
  },
  {
    slug: "sante",
    name: "Santé",
    heroTitle: "Des consommables fiables pour vos soins.",
    heroSubtitle:
      "Protection, désinfection, consommables de soins et mobilier pour cabinets, cliniques, laboratoires et centres de soins.",
    description:
      "Gants, masques, blouses, désinfectants de surface, draps d'examen et collecteurs de déchets médicaux sont disponibles en conditionnements adaptés aux structures de soins. Les tables d'examen, chariots et tabourets complètent l'équipement des salles de consultation.",
    icon: "stethoscope",
    categorySlugs: [
      "sante",
      "protection-medicale",
      "desinfection-medicale",
      "consommables-soins",
      "mobilier-medical",
      "instruments-et-diagnostic",
      "savons",
      "poubelles",
    ],
    featuredSkus: [
      "SAN-GAN-NIT-100",
      "SAN-MAS-CHI-T2-50",
      "SAN-DES-SUR-1L-12",
      "SAN-SHA-5L",
      "SAN-DRA-EXA-50X38-9",
      "SAN-COL-AIG-1-5L-24",
      "HYG-GEL-HYDRO-500",
      "HYG-SAC-POUB-30L",
    ],
    seoTitle: "Consommables et équipement médical pour professionnels de santé | KAYEN",
    seoDescription:
      "Gants, masques, désinfection, consommables de soins et mobilier médical pour cabinets, cliniques et centres de soins. Prix professionnels et livraison rapide.",
  },
  {
    slug: "evenementiel",
    name: "Événementiel",
    heroTitle: "Préparez chaque événement sans mauvaise surprise.",
    heroSubtitle:
      "Mobilier pliant, vaisselle jetable, décoration, signalétique et structures pour vos réceptions, salons et fêtes d'entreprise.",
    description:
      "Agences, traiteurs et organisateurs trouvent ici le matériel qui se monte et se range vite : tables et chaises pliantes, tentes, barrières, kakémonos, vaisselle jetable et décoration. Les quantités se commandent par lot pour couvrir un événement complet en une seule livraison.",
    icon: "party-popper",
    categorySlugs: [
      "evenementiel",
      "mobilier-evenementiel",
      "vaisselle-jetable",
      "decoration",
      "signaletique",
      "structures",
      "audio-et-eclairage",
      "emballages-alimentaires",
    ],
    featuredSkus: [
      "BUR-TAB-PLI-183",
      "BUR-CHA-PLI-PP",
      "BUR-NAP-REC-150",
      "BUR-TEN-PLI-3X3",
      "BUR-BAR-POL-250",
      "BUR-CHE-TRO-A1",
      "RES-GOB-PLA-30CL-1000",
      "RES-BOX-KRAFT-1000-300",
    ],
    seoTitle: "Matériel et fournitures pour l'événementiel | KAYEN",
    seoDescription:
      "Mobilier pliant, vaisselle jetable, décoration, signalétique, tentes et barrières pour les événements professionnels. Commandes par lot, livraison rapide.",
  },
];

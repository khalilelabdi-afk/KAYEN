import type { SeedFaq } from "../types";

/**
 * Questions fréquentes. Les réponses restent neutres vis-à-vis des paramètres
 * configurables (délais, frais, seuils) : elles renvoient vers les informations
 * affichées sur les fiches produits, au panier, dans l'espace client ou dans les CGV.
 */
export const faqs: SeedFaq[] = [
  {
    category: "commande",
    question: "Comment passer une commande sur KAYEN ?",
    answer:
      "Ajoutez les produits à votre panier depuis les fiches produits ou les listes de catégories, puis validez le panier en suivant les étapes d'adresse, de livraison et de paiement. Chaque fiche indique la quantité minimale et le multiple de commande à respecter ; le panier ajuste automatiquement les quantités saisies. Certaines références sont réservées aux comptes professionnels validés et le signalent sur leur fiche.",
  },
  {
    category: "commande",
    question: "Puis-je modifier ou annuler une commande après l'avoir validée ?",
    answer:
      "Tant que la commande n'est pas passée en préparation, vous pouvez demander sa modification ou son annulation depuis votre espace client, rubrique Commandes, ou en contactant notre service client avec le numéro de commande. Une fois la préparation lancée, la commande suit son cours et les ajustements se font par retour ou commande complémentaire. Le statut de chaque commande est visible en temps réel dans votre espace client.",
  },
  {
    category: "compte",
    question: "Faut-il un compte professionnel pour commander ?",
    answer:
      "Le catalogue et les prix publics sont consultables librement. Pour commander, créez un compte en renseignant les informations de votre entreprise (raison sociale, numéro SIREN, adresse de facturation). Certaines références et les conditions tarifaires négociées sont réservées aux comptes professionnels validés ; la validation est signalée par email dès qu'elle est effective.",
  },
  {
    category: "compte",
    question: "Comment ajouter des collaborateurs à mon compte entreprise ?",
    answer:
      "Depuis votre espace client, rubrique Entreprise, l'administrateur du compte peut inviter des collaborateurs par email et leur attribuer un rôle : acheteur, administrateur ou lecteur. Chaque collaborateur dispose de ses propres identifiants, et les commandes passées sont rattachées à l'entreprise, avec la même adresse de facturation et le même historique.",
  },
  {
    category: "prix",
    question: "Les prix affichés sont-ils hors taxes ou toutes taxes comprises ?",
    answer:
      "Les prix du catalogue sont affichés hors taxes (HT), comme il est d'usage en vente aux professionnels. Le montant de la TVA applicable est calculé et détaillé au panier, puis repris sur la facture. Vous pouvez basculer l'affichage en TTC depuis le sélecteur présent en haut des pages du catalogue.",
  },
  {
    category: "prix",
    question: "Comment fonctionnent les tarifs dégressifs ?",
    answer:
      "Chaque fiche produit affiche un tableau de paliers : au-delà de certaines quantités, le prix unitaire baisse. Le palier est appliqué automatiquement au panier en fonction de la quantité commandée pour la référence, sans code à saisir. Si votre compte bénéficie d'un tarif de groupe client, il s'applique en plus et le panier affiche le prix final retenu.",
  },
  {
    category: "livraison",
    question: "Quels sont les délais de livraison ?",
    answer:
      "Les délais indicatifs sont affichés sur chaque fiche produit et récapitulés au panier. Ils dépendent de la disponibilité de la référence, du mode de livraison choisi et de l'adresse de destination. Pour une commande regroupant des références aux délais différents, le délai du panier correspond au plus long d'entre eux ; vous pouvez demander une expédition partielle en contactant le service client.",
  },
  {
    category: "livraison",
    question: "Comment sont calculés les frais de port ?",
    answer:
      "Les frais de livraison sont calculés au panier en fonction du poids, du volume, de l'adresse de livraison et du mode de livraison sélectionné. Si un seuil de livraison offerte est en vigueur, il est indiqué au panier avec le montant restant pour l'atteindre. Les livraisons volumineuses sur palette font l'objet d'un devis de transport lorsque la fiche produit le mentionne.",
  },
  {
    category: "devis",
    question: "Comment demander un devis ?",
    answer:
      "Depuis le panier, le bouton « Demander un devis » transforme votre sélection en demande de devis, sans engagement. Certaines fiches produits indiquent également une quantité au-delà de laquelle la commande passe sur devis. Notre équipe vous répond par email ; une fois accepté, le devis se transforme en commande depuis votre espace client, rubrique Devis.",
  },
  {
    category: "devis",
    question: "Quelle est la durée de validité d'un devis ?",
    answer:
      "La durée de validité figure sur chaque devis, avec sa date d'expiration. Les prix et disponibilités y sont garantis pendant cette période. Au-delà, le devis reste consultable dans votre espace client mais ne peut plus être accepté en l'état : une nouvelle demande permet d'obtenir des conditions actualisées.",
  },
  {
    category: "paiement",
    question: "Quels moyens de paiement sont acceptés ?",
    answer:
      "Les moyens de paiement disponibles sont présentés à l'étape de paiement du panier : carte bancaire, virement bancaire et, pour les comptes professionnels éligibles, paiement sur facture à échéance. L'éligibilité au paiement à échéance et ses conditions sont indiquées dans votre espace client, rubrique Entreprise, et peuvent évoluer avec votre historique de commandes.",
  },
  {
    category: "paiement",
    question: "Le paiement en ligne est-il sécurisé ?",
    answer:
      "Les paiements par carte sont traités par un prestataire de paiement spécialisé : les données de carte sont saisies sur son interface sécurisée et ne transitent pas par nos serveurs. Pour les virements, les coordonnées bancaires à utiliser et la référence à indiquer figurent sur la confirmation de commande ; la commande est préparée à réception des fonds.",
  },
  {
    category: "facturation",
    question: "Où trouver mes factures ?",
    answer:
      "Chaque facture est disponible au format PDF dans votre espace client, rubrique Commandes, dès l'expédition de la commande correspondante. Elle est également envoyée par email à l'adresse de facturation renseignée sur le compte entreprise. Les avoirs émis à la suite d'un retour sont regroupés au même endroit.",
  },
  {
    category: "facturation",
    question: "La facture peut-elle être établie au nom de mon entreprise avec mon numéro de TVA ?",
    answer:
      "Oui. Les informations du compte entreprise (raison sociale, adresse de facturation, numéro SIREN et numéro de TVA intracommunautaire) sont reprises automatiquement sur chaque facture. Vérifiez-les dans votre espace client avant de valider une commande : une facture émise ne peut être modifiée que par l'émission d'un avoir et d'une nouvelle facture.",
  },
  {
    category: "retours",
    question: "Comment retourner un produit ?",
    answer:
      "Les conditions et le délai de retour sont précisés dans nos conditions générales de vente. La demande se fait depuis votre espace client, rubrique Commandes, en sélectionnant les lignes concernées et le motif. Les produits doivent être non utilisés et dans leur emballage d'origine ; les consommables ouverts et les produits personnalisés ne sont pas repris, sauf défaut constaté.",
  },
  {
    category: "retours",
    question: "Que faire si un colis arrive endommagé ?",
    answer:
      "Émettez des réserves précises sur le bon de livraison au moment de la réception, ou refusez le colis s'il est manifestement abîmé. Signalez ensuite l'incident depuis votre espace client dans le délai indiqué dans les conditions générales de vente, en joignant des photos du colis et des produits. Selon le cas, nous procédons à un remplacement ou à l'émission d'un avoir.",
  },
  {
    category: "disponibilite",
    question: "Que signifient les mentions « En stock », « Stock limité » et « Sur commande » ?",
    answer:
      "« En stock » indique que la quantité demandée est disponible pour une expédition dans le délai affiché. « Stock limité » signale un niveau bas : commandez rapidement ou vérifiez la quantité disponible affichée sur la fiche. « Sur commande » concerne les références réapprovisionnées auprès de nos fournisseurs à réception de la commande ; le délai spécifique est indiqué sur la fiche produit et au panier.",
  },
  {
    category: "disponibilite",
    question: "Puis-je être prévenu du retour en stock d'un produit ?",
    answer:
      "Oui. Sur la fiche d'un produit momentanément indisponible, le bouton « M'avertir du retour en stock » enregistre une alerte liée à votre compte. Vous recevez un email dès que la référence est de nouveau disponible. Lorsque la fiche propose la précommande, vous pouvez aussi commander immédiatement : la ligne est expédiée dès réception du réapprovisionnement.",
  },
];

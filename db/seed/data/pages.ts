import type { SeedPage } from "../types";

/**
 * Pages institutionnelles (pied de page). Le contenu est un squelette structuré :
 * les informations propres à l'entreprise sont signalées par des marqueurs
 * « [À compléter : …] » à renseigner avant la mise en production.
 */
export const pages: SeedPage[] = [
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    excerpt: "Identification de l'éditeur du site, de l'hébergeur et des responsables de publication.",
    showInFooter: true,
    content: `## Éditeur du site

Le site KAYEN est édité par :

- Dénomination sociale : [À compléter : raison sociale]
- Forme juridique : [À compléter : SAS, SARL, etc.]
- Capital social : [À compléter : montant]
- Siège social : [À compléter : adresse complète]
- Numéro SIREN / RCS : [À compléter : numéro et ville du greffe]
- Numéro de TVA intracommunautaire : [À compléter]
- Adresse électronique : [À compléter : adresse de contact]
- Téléphone : [À compléter]

## Directeur de la publication

[À compléter : nom et qualité du directeur de la publication]

## Hébergement

Le site est hébergé par :

- Raison sociale : [À compléter : nom de l'hébergeur]
- Adresse : [À compléter]
- Téléphone : [À compléter]

## Propriété intellectuelle

L'ensemble des contenus du site (textes, visuels, logos, structure, base de données produits) est protégé par le droit de la propriété intellectuelle. Toute reproduction, représentation ou réutilisation, totale ou partielle, sans autorisation écrite préalable est interdite.

Les marques et visuels de fournisseurs présentés sur le site restent la propriété de leurs titulaires respectifs.

## Données personnelles

Les modalités de traitement des données personnelles sont décrites dans la [politique de confidentialité](/pages/confidentialite). Le site utilise des cookies dans les conditions décrites dans la [politique de cookies](/pages/cookies).

## Limitation de responsabilité

Les informations présentes sur le site sont fournies à titre indicatif. Les caractéristiques, disponibilités et délais affichés peuvent évoluer ; les conditions applicables à une commande sont celles indiquées au moment de sa validation et dans les [conditions générales de vente](/pages/cgv).

## Contact

Pour toute question relative au site : [À compléter : adresse électronique ou formulaire de contact].`,
  },
  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    excerpt: "Quelles données nous collectons, pourquoi, pendant combien de temps et quels sont vos droits.",
    showInFooter: true,
    content: `## Responsable du traitement

Le responsable du traitement des données collectées sur le site est [À compléter : raison sociale et adresse], joignable à [À compléter : adresse électronique dédiée à la protection des données].

[À compléter : coordonnées du délégué à la protection des données, si un DPO est désigné.]

## Données collectées

Dans le cadre de l'utilisation du site et du passage de commandes, nous collectons :

- les données d'identification du compte (nom, prénom, adresse électronique, téléphone) ;
- les données de l'entreprise (raison sociale, SIREN, numéro de TVA, adresses de facturation et de livraison) ;
- les données de commande (produits, montants, historique, devis, factures) ;
- les données techniques de navigation (adresse IP, pages consultées, identifiants de session) ;
- les échanges avec le service client.

Les données de carte bancaire sont saisies directement auprès de notre prestataire de paiement et ne sont pas conservées par nos soins.

## Finalités et bases légales

| Finalité | Base légale |
| --- | --- |
| Création et gestion du compte professionnel | Exécution du contrat |
| Traitement des commandes, devis, livraisons et factures | Exécution du contrat et obligations légales |
| Service client et gestion des retours | Exécution du contrat |
| Envoi d'informations commerciales | Intérêt légitime ou consentement selon le cas |
| Statistiques d'audience et amélioration du site | Intérêt légitime ou consentement (cookies) |
| Prévention de la fraude et sécurité | Intérêt légitime |

## Destinataires des données

Les données sont traitées par nos équipes habilitées et par des prestataires intervenant pour notre compte : hébergement, paiement, transport, envoi d'emails, outils de support. [À compléter : liste des catégories de sous-traitants et, le cas échéant, transferts hors Union européenne et garanties associées.]

## Durées de conservation

- Données du compte : pendant la durée de la relation commerciale, puis [À compléter : durée] après la dernière activité.
- Données de commande et de facturation : pendant la durée légale de conservation des documents comptables.
- Données de prospection : [À compléter : durée] à compter du dernier contact.
- Données de navigation : voir la [politique de cookies](/pages/cookies).

## Vos droits

Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de vos données, ainsi que du droit de définir des directives relatives à leur sort après votre décès. Vous pouvez exercer ces droits en écrivant à [À compléter : adresse électronique], en joignant un justificatif d'identité si nécessaire.

Vous pouvez également introduire une réclamation auprès de l'autorité de contrôle compétente : [À compléter : nom et site de l'autorité].

## Sécurité

Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger les données contre l'accès non autorisé, la perte ou l'altération : chiffrement des échanges, contrôle des accès, journalisation, sauvegardes.

## Mise à jour

La présente politique peut être mise à jour. Date de dernière mise à jour : [À compléter].`,
  },
  {
    slug: "cgv",
    title: "Conditions générales de vente",
    excerpt: "Conditions applicables aux commandes passées par des professionnels sur le site KAYEN.",
    showInFooter: true,
    content: `## Article 1 – Champ d'application

Les présentes conditions générales de vente (CGV) s'appliquent à toutes les ventes conclues entre [À compléter : raison sociale] (le « Vendeur ») et tout acheteur professionnel (le « Client ») sur le site KAYEN. Le site est réservé aux professionnels : toute commande suppose l'existence d'une activité professionnelle et la fourniture d'un numéro d'identification valide.

Toute commande implique l'acceptation sans réserve des présentes CGV, qui prévalent sur toutes conditions d'achat du Client sauf accord écrit du Vendeur.

## Article 2 – Compte client et validation

L'ouverture d'un compte est nécessaire pour commander. Le Vendeur se réserve la possibilité de vérifier les informations fournies et de réserver certaines références ou conditions aux comptes validés. Le Client est responsable de la confidentialité de ses identifiants et des commandes passées par les utilisateurs qu'il a rattachés à son compte.

## Article 3 – Produits et disponibilité

Les caractéristiques des produits sont décrites sur les fiches produits. Les visuels sont non contractuels. Les disponibilités et délais affichés sont indicatifs et actualisés régulièrement ; en cas d'indisponibilité après commande, le Client en est informé et peut choisir entre un produit de remplacement, l'attente du réapprovisionnement ou l'annulation de la ligne concernée.

## Article 4 – Prix

Les prix sont exprimés en euros hors taxes, hors frais de livraison. La TVA applicable est ajoutée au panier. Les tarifs dégressifs, promotions et conditions de groupe client s'appliquent selon les modalités affichées au moment de la commande. Le Vendeur peut modifier ses prix à tout moment ; le prix facturé est celui en vigueur à la validation de la commande.

## Article 5 – Commande et devis

La commande est ferme à sa validation et au paiement selon le mode choisi. Les quantités minimales et multiples de commande indiqués sur les fiches produits s'imposent. Les devis émis par le Vendeur sont valables pour la durée qu'ils mentionnent.

## Article 6 – Paiement

Les moyens de paiement acceptés sont indiqués à l'étape de paiement. Le paiement à échéance est réservé aux Clients ayant obtenu un accord préalable. [À compléter : conditions de paiement à échéance, pénalités de retard et indemnité forfaitaire de recouvrement applicables.]

## Article 7 – Livraison

Les modalités, frais et délais de livraison sont précisés sur la page [Livraison](/pages/livraison) et au panier. Le Client vérifie l'état des colis à la réception et formule toute réserve sur le bon de livraison ; les réclamations pour avarie ou manquant doivent être signalées dans le délai indiqué sur la page Livraison. [À compléter : clause de transfert des risques.]

## Article 8 – Retours et réclamations

Les conditions de retour sont décrites sur la page [Retours](/pages/retours). [À compléter : délai de rétractation éventuellement consenti aux professionnels, frais de retour, exclusions.]

## Article 9 – Garanties

Les produits bénéficient des garanties légales applicables entre professionnels et, le cas échéant, des garanties commerciales mentionnées sur les fiches produits. [À compléter : durée et modalités des garanties commerciales.]

## Article 10 – Responsabilité

La responsabilité du Vendeur ne saurait être engagée en cas de mauvaise utilisation des produits, de non-respect des consignes des fiches techniques ou de données de sécurité, ou de cas de force majeure. [À compléter : plafond de responsabilité éventuel.]

## Article 11 – Réserve de propriété

Les produits restent la propriété du Vendeur jusqu'au paiement intégral du prix.

## Article 12 – Données personnelles

Le traitement des données est décrit dans la [politique de confidentialité](/pages/confidentialite).

## Article 13 – Droit applicable et litiges

Les présentes CGV sont soumises au droit [À compléter : droit applicable]. À défaut de règlement amiable, tout litige relève du tribunal de [À compléter : juridiction compétente].

Date de dernière mise à jour : [À compléter].`,
  },
  {
    slug: "cookies",
    title: "Politique de cookies",
    excerpt: "Les cookies et traceurs utilisés sur le site, leur finalité et la manière de gérer vos choix.",
    showInFooter: true,
    content: `## Qu'est-ce qu'un cookie ?

Un cookie est un petit fichier déposé sur votre terminal lors de la consultation d'un site. Il permet de reconnaître votre navigateur, de conserver certaines informations entre deux pages (panier, session) ou de mesurer l'audience du site.

## Cookies utilisés sur le site

### Cookies strictement nécessaires

Ils permettent le fonctionnement du site et ne requièrent pas votre consentement :

- gestion de la session et de l'authentification ;
- conservation du panier et du mode d'affichage des prix (HT / TTC) ;
- sécurité et prévention de la fraude ;
- enregistrement de vos choix en matière de cookies.

### Cookies de mesure d'audience

[À compléter : outil de mesure d'audience utilisé, finalité, durée de conservation et modalité d'exemption de consentement le cas échéant.]

### Cookies de personnalisation et de marketing

[À compléter : liste des éventuels traceurs tiers, finalités et durées. Supprimer cette section si aucun traceur de ce type n'est utilisé.]

## Tableau récapitulatif

| Nom | Finalité | Durée | Consentement requis |
| --- | --- | --- | --- |
| [À compléter] | Session et authentification | Session | Non |
| [À compléter] | Panier et préférences d'affichage | [À compléter] | Non |
| [À compléter] | Mesure d'audience | [À compléter] | [À compléter] |

## Gérer vos choix

Lors de votre première visite, un bandeau vous permet d'accepter ou de refuser les cookies soumis à consentement. Vous pouvez modifier vos choix à tout moment depuis le lien « Gérer les cookies » présent en pied de page.

Vous pouvez également configurer votre navigateur pour bloquer ou supprimer les cookies ; certaines fonctionnalités du site (connexion, panier) peuvent alors ne plus fonctionner correctement.

## Durée de conservation du consentement

Vos choix sont conservés pendant [À compléter : durée], après quoi le bandeau vous est présenté à nouveau.

## Contact

Pour toute question : [À compléter : adresse électronique].`,
  },
  {
    slug: "livraison",
    title: "Livraison",
    excerpt: "Modes de livraison, délais, frais de port et réception des colis.",
    showInFooter: true,
    content: `## Zones desservies

Nous livrons les adresses professionnelles situées en [À compléter : zones géographiques desservies]. Pour une livraison hors de ces zones, contactez-nous pour un devis de transport.

## Modes de livraison

Les modes disponibles sont proposés au panier en fonction du poids, du volume et de l'adresse de la commande :

- **Colis** : commandes de petit et moyen volume, remises par un transporteur de messagerie.
- **Palette** : commandes volumineuses ou lourdes, livrées par transporteur avec hayon ou sur rendez-vous selon l'accès.
- [À compléter : retrait sur place, livraison par nos propres véhicules, autres options.]

Les livraisons s'effectuent en journée, les jours ouvrés, à l'adresse indiquée lors de la commande. Précisez dans les instructions de livraison les contraintes d'accès (horaires, quai, étage, interphone).

## Délais

Les délais indicatifs sont affichés sur chaque fiche produit et récapitulés au panier. Ils courent à compter de la confirmation de la commande et de l'encaissement du paiement, ou de l'accord de paiement à échéance. Lorsqu'une commande regroupe des références de délais différents, elle est expédiée en une fois au délai le plus long, sauf demande d'expédition partielle.

## Frais de livraison

Les frais sont calculés au panier avant validation. [À compléter : grille tarifaire ou principes de calcul, seuil de livraison offerte, conditions particulières pour les palettes.]

## Suivi de commande

Le numéro de suivi est transmis par email à l'expédition et consultable dans votre espace client, rubrique Commandes.

## Réception des colis

À la livraison, vérifiez le nombre de colis et leur état en présence du livreur. En cas de colis abîmé ou de manquant, inscrivez des réserves précises et datées sur le bon de livraison (ou refusez la livraison), puis signalez l'incident depuis votre espace client dans un délai de [À compléter : délai] en joignant des photos. Les réserves générales du type « sous réserve de déballage » ne sont pas suffisantes.

## Contact

Service client : [À compléter : adresse électronique et téléphone, horaires].`,
  },
  {
    slug: "paiement",
    title: "Paiement",
    excerpt: "Moyens de paiement acceptés, sécurité des transactions et paiement à échéance pour les comptes éligibles.",
    showInFooter: true,
    content: `## Moyens de paiement acceptés

Les moyens disponibles sont affichés à l'étape de paiement :

- **Carte bancaire** : paiement immédiat via notre prestataire de paiement. [À compléter : réseaux de cartes acceptés.]
- **Virement bancaire** : les coordonnées bancaires et la référence à indiquer figurent sur la confirmation de commande ; la préparation démarre à réception des fonds.
- **Paiement à échéance sur facture** : réservé aux comptes professionnels ayant obtenu un accord préalable (voir ci-dessous).
- [À compléter : prélèvement SEPA, mandat administratif, autres moyens.]

## Sécurité des paiements

Les paiements par carte sont traités sur l'interface sécurisée de notre prestataire : vos données de carte ne transitent pas par nos serveurs et ne sont pas conservées par nos soins. [À compléter : nom du prestataire, protocole d'authentification renforcée.]

## Paiement à échéance

Les comptes professionnels peuvent demander l'ouverture d'un encours de paiement à échéance depuis leur espace client, rubrique Entreprise. [À compléter : conditions d'éligibilité, documents demandés, délai de paiement accordé, plafond d'encours, pénalités de retard et indemnité de recouvrement.]

Lorsque le paiement à échéance est activé, la facture est émise à l'expédition et sa date d'échéance y figure. Les commandes dépassant l'encours autorisé sont réglées par carte ou virement.

## Factures et avoirs

Chaque facture est disponible au format PDF dans votre espace client dès l'expédition, et envoyée par email à l'adresse de facturation. Les avoirs consécutifs à un retour ou à un litige sont émis au même endroit et peuvent être déduits d'une commande ultérieure ou remboursés selon le mode de paiement initial.

## Devises et taxes

Les prix sont libellés en euros. La TVA applicable est calculée au panier selon les informations du compte entreprise. [À compléter : conditions de facturation hors taxes pour les clients intracommunautaires ou hors Union européenne.]

## Contact

Service comptabilité : [À compléter : adresse électronique et téléphone].`,
  },
  {
    slug: "retours",
    title: "Retours et réclamations",
    excerpt: "Conditions de retour des produits, traitement des réclamations et remboursements.",
    showInFooter: true,
    content: `## Principes

Les retours sont acceptés dans les conditions ci-dessous, sous réserve d'un accord préalable obtenu via votre espace client. Aucun retour n'est accepté sans numéro de retour.

## Délai et conditions

- Délai pour demander un retour : [À compléter : nombre de jours] à compter de la réception.
- Les produits doivent être non utilisés, complets, dans leur emballage d'origine non ouvert et en état d'être revendus.
- Ne sont pas repris, sauf défaut constaté : les consommables ouverts ou entamés, les produits d'hygiène et alimentaires déconditionnés, les produits personnalisés, les références commandées sur devis ou sur commande spéciale.
- [À compléter : frais de retour à la charge du Client ou du Vendeur selon le motif, éventuels frais de remise en stock.]

## Comment faire une demande

1. Depuis votre espace client, rubrique Commandes, sélectionnez la commande puis les lignes concernées.
2. Indiquez le motif (erreur de commande, produit non conforme, produit endommagé, défaut) et joignez des photos si nécessaire.
3. Après validation, vous recevez un numéro de retour et les instructions d'expédition ou d'enlèvement.
4. Emballez soigneusement les produits et indiquez le numéro de retour sur le colis.

## Produits endommagés ou non conformes

Signalez tout produit endommagé, manquant ou non conforme dans le délai indiqué sur la page [Livraison](/pages/livraison), avec les réserves portées sur le bon de livraison. Selon le cas, nous procédons à un remplacement, à l'envoi des manquants ou à l'émission d'un avoir, sans frais pour vous.

## Remboursements et avoirs

Après réception et contrôle du retour, nous émettons un avoir ou un remboursement dans un délai de [À compléter : délai]. Le remboursement est effectué sur le mode de paiement initial ; l'avoir est déductible d'une commande ultérieure.

## Garanties

Les produits sont couverts par les garanties légales applicables entre professionnels et, le cas échéant, par les garanties commerciales mentionnées sur leur fiche. Pour un produit tombant en panne pendant la période de garantie, contactez le service client avec le numéro de commande et une description du défaut. [À compléter : modalités de prise en charge, réparation ou échange.]

## Contact

Service client : [À compléter : adresse électronique et téléphone, horaires].`,
  },
];

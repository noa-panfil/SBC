# Boutique Stripe du Seclin Basket Club

Ce document décrit l'installation manuelle et la mise en service de la boutique. Aucune migration ne s'exécute au démarrage de l'application.

## Fonctionnalités ajoutées

- catalogue public responsive avec collections illustrées par des bannières, produits, images, couleurs, tailles et prix par variante ;
- panier conservé dans `localStorage`, quantités limitées à 10 et contrôle serveur complet avant paiement ;
- collecte des coordonnées sans adresse postale, retrait uniquement au club ;
- Stripe Checkout hébergé en paiement unique EUR ;
- commandes et lignes immuables enregistrées dans MySQL avant la redirection Stripe ;
- webhook Stripe signé, idempotent et responsable de la confirmation du paiement ;
- e-mails Resend client, bureau, suivi fournisseur et disponibilité au club ;
- administration guidée des collections, produits, couleurs, tailles, images, commandes et statuts ;
- deuxième base MySQL dédiée à la boutique, séparée des données générales du site ;
- images produit enregistrées dans `shop_images` dans cette deuxième base ;
- lots fournisseur mensuels et export Excel à deux feuilles ;
- page provisoire de conditions de vente à faire valider par le bureau.

## Dépendances npm

Les SDK officiels `stripe` et `resend` ont été ajoutés. Le package `xlsx`, déjà présent, est réutilisé.

```bash
npm install
npm run lint
npm run build
```

## 1. Créer la deuxième base manuellement

1. Faire une sauvegarde de la base principale depuis Hostinger/phpMyAdmin.
2. Ouvrir l'onglet SQL du serveur MySQL.
3. Copier l'intégralité de `database/boutique-stripe.sql`.
4. Si nécessaire, remplacer `sbc_boutique` par le nom autorisé par l'hébergeur.
5. Exécuter le bloc principal de haut en bas, une seule fois.
6. Ne pas décommenter le bloc de suppression placé à la fin.
7. Vérifier que la base dédiée contient les dix tables `shop_*`.

Ordre de création : `shop_images`, `shop_collections`, `shop_products`, `shop_product_images`, `shop_product_variants`, `shop_supplier_batches`, `shop_orders`, `shop_order_items`, `shop_order_status_history`, `shop_stripe_events`.

`shop_product_images.image_id` possède désormais une clé étrangère vers `shop_images.id`. Les nouveaux uploads boutique ne sont donc plus enregistrés dans la table `images` de la base principale.

Le script `database/boutique-stripe.sql` contient directement le schéma à jour complet. Aucun autre correctif SQL boutique n'est nécessaire pour une nouvelle installation.

### Base boutique déjà créée avant la gestion des couleurs

Si la base existe déjà, exécuter manuellement une seule fois ces deux ajouts avant de redémarrer l'application :

```sql
ALTER TABLE shop_product_variants
    ADD COLUMN color_hex CHAR(7) NULL AFTER color;

ALTER TABLE shop_product_images
    ADD COLUMN color VARCHAR(100) NULL AFTER image_id;
```

`color_hex` définit la couleur de la pastille affichée au client. `shop_product_images.color` permet de rattacher une photo à une couleur du vêtement ; une valeur `NULL` conserve une photo générale visible pour toutes les couleurs.

### Base boutique déjà créée avant la gestion des collections

Si la base existe déjà, exécuter manuellement une seule fois ce bloc avant de redémarrer l'application :

```sql
ALTER TABLE shop_images
    ADD COLUMN purpose ENUM('product', 'collection_banner') NOT NULL DEFAULT 'product' AFTER byte_size;

CREATE TABLE shop_collections (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    description VARCHAR(2000) NOT NULL DEFAULT '',
    banner_image_id BIGINT UNSIGNED NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_shop_collections_slug (slug),
    KEY idx_shop_collections_banner (banner_image_id),
    KEY idx_shop_collections_active_order (is_active, display_order, id),
    CONSTRAINT fk_shop_collections_banner
        FOREIGN KEY (banner_image_id) REFERENCES shop_images(id)
        ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE shop_products
    ADD COLUMN collection_id BIGINT UNSIGNED NULL AFTER description,
    ADD KEY idx_shop_products_collection_order (collection_id, display_order, id),
    ADD CONSTRAINT fk_shop_products_collection
        FOREIGN KEY (collection_id) REFERENCES shop_collections(id)
        ON DELETE SET NULL ON UPDATE RESTRICT;
```

Les produits existants restent sans collection et continuent d'être affichés. Ils pourront ensuite être classés depuis l'administration.

### Collections déjà créées avant les bannières

Si la table `shop_collections` existe déjà mais ne possède pas encore de bannière, exécuter uniquement ce bloc :

```sql
ALTER TABLE shop_images
    ADD COLUMN purpose ENUM('product', 'collection_banner') NOT NULL DEFAULT 'product' AFTER byte_size;

ALTER TABLE shop_collections
    ADD COLUMN banner_image_id BIGINT UNSIGNED NULL AFTER description,
    ADD KEY idx_shop_collections_banner (banner_image_id),
    ADD CONSTRAINT fk_shop_collections_banner
        FOREIGN KEY (banner_image_id) REFERENCES shop_images(id)
        ON DELETE SET NULL ON UPDATE RESTRICT;
```

Les bannières sont recadrées et validées au format fixe `1600 × 300 px`. Les photos produit restent au format `1200 × 1200 px`.

## 2. Variables d'environnement

```env
# Base principale du site
DB_HOST=localhost
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=

# Deuxième base réservée à la boutique
SHOP_DB_HOST=localhost
SHOP_DB_PORT=3306
SHOP_DB_USER=
SHOP_DB_PASSWORD=
SHOP_DB_NAME=sbc_boutique

NEXT_PUBLIC_APP_URL=https://seclinbasketclub.fr
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
SHOP_FROM_EMAIL=Seclin Basket Club <commandes@seclinbasketclub.fr>
SHOP_REPLY_TO_EMAIL=seclinbc@gmail.com
SHOP_NOTIFICATION_EMAIL=seclinbc@gmail.com
```

Si les deux bases utilisent le même serveur et le même compte MySQL, `SHOP_DB_HOST`, `SHOP_DB_PORT`, `SHOP_DB_USER` et `SHOP_DB_PASSWORD` peuvent être omis : l'application réutilise alors les valeurs `DB_*`. `SHOP_DB_NAME` doit identifier la deuxième base et vaut `sbc_boutique` par défaut.

Le compte MySQL doit avoir les droits nécessaires sur les deux bases. Ne jamais mettre de secret dans Git. En local, placer les valeurs de test dans `.env.local`. Sur le VPS, les placer dans le fichier d'environnement privé utilisé par le processus Node, avec des permissions restreintes. La redirection vers l'URL Checkout ne nécessite aucune clé Stripe publique.

## 3. Configurer Stripe en test

1. Activer le mode test du Dashboard Stripe.
2. Créer ou révéler une clé secrète test et la placer dans `STRIPE_SECRET_KEY`.
3. Pour un webhook local, installer la Stripe CLI puis lancer `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
4. Copier le signing secret `whsec_...` affiché par la CLI dans `STRIPE_WEBHOOK_SECRET`.
5. Dans le Dashboard pour la production, créer une destination webhook HTTPS vers `https://seclinbasketclub.fr/api/stripe/webhook`.
6. Sélectionner : `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired` et `charge.refunded`.
7. Ouvrir le webhook créé, révéler son signing secret et le placer uniquement dans l'environnement du VPS.

Pour tester un paiement en mode test, utiliser la carte Stripe `4242 4242 4242 4242`, une date future et un CVC quelconque. Vérifier ensuite la commande dans `/admin/boutique/commandes`. La page de confirmation ne marque jamais une commande comme payée : seul le webhook le fait.

## 4. Configurer Resend

1. Dans Resend, créer une nouvelle clé réservée à cette application.
2. Accorder uniquement la permission d'envoi d'e-mails si l'interface Resend propose cette granularité.
3. Copier la clé une seule fois dans `RESEND_API_KEY` sur le VPS.
4. Confirmer que le domaine `seclinbasketclub.fr` reste vérifié et que `commandes@seclinbasketclub.fr` est autorisé.
5. Conserver l'expéditeur, l'adresse de réponse et la notification du bureau définis ci-dessus.
6. Effectuer un paiement test : vérifier séparément l'e-mail client et l'e-mail reçu par le bureau.
7. Créer un lot de test, le marquer `Envoyé`, puis vérifier l'e-mail « commande transmise au fournisseur » reçu par le client.
8. Marquer ce lot `Reçu`, puis vérifier le deuxième e-mail. Celui-ci précise au client qu'il doit encore attendre l'e-mail de disponibilité avant de venir au club.
9. Marquer le lot `Disponible au club` : toutes ses commandes éligibles passent à ce statut et chaque client reçoit automatiquement l'e-mail de retrait.
10. Vérifier que les boutons de relance n'envoient que les messages manquants et ne créent aucun doublon.

Les envois utilisent une clé d'idempotence stable par commande et par type d'e-mail. Un échec est marqué séparément afin qu'une relance ne renvoie pas les messages déjà réussis. Depuis l'historique des lots, les boutons de relance permettent au bureau de réessayer les notifications manquantes.

## 5. Préparer et tester la boutique

1. Créer la deuxième base avec le SQL complet.
2. Configurer `SHOP_DB_NAME` et les autres variables de la deuxième connexion.
3. Démarrer l'application avec `npm run dev`.
4. Se connecter avec un compte administrateur.
5. Créer une collection, lui associer une bannière 1600 × 300 px, puis créer un produit inactif dans `/admin/boutique/produits` et l'associer à cette collection.
6. Créer les couleurs et leurs tailles, choisir la teinte de chaque pastille, puis uploader les images au format carré 1200 × 1200 px en les associant à la bonne couleur.
7. Vérifier le choix couleur/taille, le changement de prix et les quantités sur mobile et ordinateur.
8. Ajouter au panier, vérifier les champs client et accepter les deux confirmations.
9. Effectuer un paiement test.
10. Vérifier les montants, le PaymentIntent, l'historique et les e-mails dans l'administration.
11. Créer un lot mensuel, exporter le fichier XLSX et contrôler les feuilles `Synthèse fournisseur` et `Détail commandes`.
12. Marquer le lot envoyé, reçu, puis disponible au club ; vérifier les trois notifications de suivi, puis marquer une commande retirée.

Tester également : boutique vide, variante désactivée après ajout au panier, prix modifié après ajout, panier altéré dans le navigateur, quantité 0/11, e-mail invalide, double webhook, signature webhook invalide, paiement annulé, session expirée et panne temporaire Resend.

## 6. Passage en production sur le VPS

1. Faire valider les conditions de vente, les délais, le lieu/horaire de retrait, la politique de remboursement et l'information RGPD par le bureau.
2. Sauvegarder la base principale puis créer la deuxième base avec le script complet.
3. Configurer les variables `SHOP_DB_*` dans l'environnement privé du VPS.
4. Renseigner les clés Stripe **live** et la clé Resend dans ce même environnement privé.
5. Vérifier `NEXT_PUBLIC_APP_URL=https://seclinbasketclub.fr`.
6. Installer et compiler sans afficher le contenu des fichiers d'environnement : `npm ci`, puis `npm run build`.
7. Créer le webhook live avec l'URL et les événements listés plus haut.
8. Redémarrer uniquement le processus de l'application via le gestionnaire déjà utilisé sur le VPS (par exemple `pm2 restart <nom-app> --update-env`), sans passer les secrets sur la ligne de commande et sans les afficher dans les logs.
9. Consulter les logs techniques, sans copier de secret ou de donnée client dans un ticket public.
10. Créer un produit pilote et réaliser une petite commande réelle contrôlée avant l'ouverture générale.

## Checklist avant ouverture

- [ ] sauvegarde de la base principale effectuée ;
- [ ] deuxième base créée avec ses dix tables ;
- [ ] variables `SHOP_DB_*` configurées et droits MySQL vérifiés ;
- [ ] nouvelle boutique volontairement vide ou données ajoutées depuis l'administration ;
- [ ] aucune migration automatique ajoutée ;
- [ ] CGV validées et publiées ;
- [ ] information RGPD et politique de remboursement validées ;
- [ ] lieu, horaires et délai de retrait confirmés ;
- [ ] clés Stripe live et signing secret live configurés ;
- [ ] webhook live actif et événements sélectionnés ;
- [ ] clé Resend limitée et expéditeur vérifié ;
- [ ] e-mails client, bureau, lot envoyé, lot reçu et disponibilité testés ;
- [ ] recalcul serveur testé après changement de prix ;
- [ ] administration accessible uniquement au rôle `admin` ;
- [ ] export Excel vérifié par le responsable fournisseur ;
- [ ] test mobile, tablette, clavier et contrastes effectué ;
- [ ] paiement réel pilote remboursé ou conservé selon la décision du bureau ;
- [ ] surveillance des erreurs Stripe/Resend organisée.

## Désinstallation

Le bloc de suppression est commenté à la fin du fichier SQL. Il supprime définitivement toutes les données puis la deuxième base boutique et ne doit être utilisé qu'après sauvegarde et décision explicite du club. Il ne touche pas à la base principale.

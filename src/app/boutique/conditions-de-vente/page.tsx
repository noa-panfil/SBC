import type { Metadata } from "next";
import Link from "next/link";
/* eslint-disable react/no-unescaped-entities */

export const metadata: Metadata = {
    title: "Conditions générales de vente | Boutique SBC",
    description: "Conditions générales de vente de la boutique officielle du Seclin Basket Club.",
};

const sectionClassName = "space-y-3";
const titleClassName = "text-xl font-black text-gray-950";
const paragraphClassName = "leading-7 text-gray-600";

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-gray-50/70">
            <div className="container mx-auto max-w-4xl px-4 py-10 md:py-14">
                <header className="rounded-3xl bg-sbc-dark p-7 text-white shadow-xl md:p-10">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-green-200">Boutique officielle</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Conditions générales de vente</h1>
                    <p className="mt-4 max-w-2xl leading-7 text-green-50/85">
                        Les présentes conditions encadrent les commandes passées sur la boutique en ligne du Seclin Basket Club.
                    </p>
                    <p className="mt-5 text-sm font-bold text-green-100">Version du 28 août 2026</p>
                </header>

                <aside className="mt-6 rounded-2xl border border-orange-300 bg-orange-50 p-5 text-sm leading-6 text-orange-950">
                    <p className="font-black"><i className="fas fa-exclamation-triangle mr-2" />Informations à compléter avant l'ouverture des paiements</p>
                    <p className="mt-2">
                        Le bureau doit encore renseigner le numéro de téléphone, les numéros RNA et SIREN/SIRET s'ils existent,
                        le régime de TVA applicable, le lieu et les créneaux habituels de retrait ainsi que les coordonnées du
                        médiateur de la consommation désigné par le club.
                    </p>
                </aside>

                <div className="mt-6 space-y-10 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-10">
                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>1. Vendeur</h2>
                        <p className={paragraphClassName}>
                            La boutique est exploitée par <strong>Seclin Basket Club (SBC)</strong>, association régie par la loi
                            du 1er juillet 1901, dont l'adresse est <strong>7 rue Joliot Curie, 59113 Seclin, France</strong>, représentée
                            par son président, <strong>M. Grégory Duponchel</strong>.
                        </p>
                        <p className={paragraphClassName}>
                            Contact pour toute question ou réclamation :{" "}
                            <a className="font-bold text-sbc underline" href="mailto:seclinbc@gmail.com">seclinbc@gmail.com</a>.
                            Les informations complémentaires relatives à l'éditeur sont disponibles dans les{" "}
                            <Link className="font-bold text-sbc underline" href="/mentions-legales">mentions légales</Link>.
                        </p>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>2. Champ d'application et acceptation</h2>
                        <p className={paragraphClassName}>
                            Les présentes conditions s'appliquent aux ventes de vêtements, accessoires et personnalisations
                            proposées sur la boutique en ligne du SBC à des consommateurs. Elles sont consultables avant la
                            commande. Le client reconnaît en avoir pris connaissance et les accepter en cochant la case prévue
                            à cet effet avant le paiement.
                        </p>
                        <p className={paragraphClassName}>
                            La version applicable est celle acceptée au moment de la commande. Le client doit être majeur ou
                            disposer de l'autorisation de son représentant légal et avoir la capacité de conclure le contrat.
                        </p>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>3. Produits et personnalisations</h2>
                        <p className={paragraphClassName}>
                            Les caractéristiques essentielles, tailles, couleurs, disponibilités, photographies et prix sont
                            présentés sur chaque fiche produit. Le client doit vérifier ces informations et la composition de
                            son panier avant de commander. Les photographies illustrent les produits mais de légères différences
                            de couleur liées à l'écran ou à la fabrication peuvent exister.
                        </p>
                        <p className={paragraphClassName}>
                            Lorsqu'un produit est personnalisable, le client choisit séparément le texte et/ou le numéro, leur
                            emplacement et les valeurs à imprimer. Chaque option affiche son propre tarif et peut être gratuite.
                            Le client est seul responsable de l'orthographe, du numéro et de l'emplacement validés. Le SBC peut
                            refuser une personnalisation manifestement illicite, injurieuse, discriminatoire ou portant atteinte
                            aux droits d'un tiers ; la somme correspondante est alors remboursée.
                        </p>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>4. Prix</h2>
                        <p className={paragraphClassName}>
                            Les prix sont indiqués en euros et correspondent au montant total dû par le client, toutes taxes
                            comprises lorsque la TVA est applicable. Le tarif des personnalisations sélectionnées est ajouté au
                            prix du produit et apparaît dans le panier ainsi que dans le récapitulatif final. Aucun frais de
                            livraison n'est facturé, les commandes étant exclusivement retirées au club.
                        </p>
                        <p className={paragraphClassName}>
                            Le SBC peut modifier ses prix à tout moment. Le prix facturé reste celui affiché et validé lors de la
                            commande, sous réserve de la correction d'une erreur manifeste dont le client serait informé avant
                            toute exécution.
                        </p>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>5. Commande</h2>
                        <ol className="list-decimal space-y-2 pl-6 leading-7 text-gray-600">
                            <li>Le client sélectionne les produits, variantes, quantités et éventuelles personnalisations.</li>
                            <li>Il vérifie son panier, renseigne ses coordonnées puis contrôle le récapitulatif et le prix total.</li>
                            <li>Il accepte les présentes conditions et confirme avoir compris que le retrait se fait au club.</li>
                            <li>Il est redirigé vers Stripe afin de procéder au paiement.</li>
                        </ol>
                        <p className={paragraphClassName}>
                            La commande devient définitive après confirmation du paiement. Un numéro de commande et un e-mail
                            récapitulatif sont alors adressés au client. Le SBC peut annuler et rembourser une commande en cas
                            d'indisponibilité, d'erreur manifeste, de suspicion de fraude ou d'impossibilité de réaliser une
                            personnalisation conforme à la demande.
                        </p>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>6. Paiement</h2>
                        <p className={paragraphClassName}>
                            Le paiement intégral est effectué en ligne par carte bancaire au moyen de la page sécurisée Stripe.
                            Les moyens de paiement effectivement acceptés sont ceux affichés par Stripe au moment du règlement.
                            Le SBC ne reçoit et ne conserve pas le numéro complet de la carte bancaire. La commande n'est pas
                            considérée comme payée tant que Stripe n'a pas confirmé le règlement.
                        </p>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>7. Commandes groupées et délai</h2>
                        <p className={paragraphClassName}>
                            Les commandes sont regroupées puis transmises au fournisseur au début du mois suivant leur paiement.
                            Le client reçoit des informations par e-mail lors des principales étapes de préparation. Sauf délai
                            différent clairement indiqué avant la commande, le SBC s'engage à mettre les produits à disposition
                            dans un délai maximal de trente jours à compter de la confirmation de la commande.
                        </p>
                        <p className={paragraphClassName}>
                            En cas de retard, le client peut demander au SBC d'exécuter la commande dans un délai supplémentaire
                            raisonnable. Si le SBC ne s'exécute pas dans ce nouveau délai, le client peut résoudre le contrat dans
                            les conditions prévues par le Code de la consommation et obtenir le remboursement des sommes versées.
                        </p>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>8. Retrait au club</h2>
                        <p className={paragraphClassName}>
                            Aucune livraison postale n'est proposée. Le retrait est gratuit et s'effectue uniquement au Seclin
                            Basket Club. Le client doit attendre l'e-mail confirmant que sa commande est disponible ; cet e-mail
                            précise le lieu et les modalités pratiques de retrait. Une pièce d'identité ou le numéro de commande
                            peut être demandé afin d'éviter la remise à une mauvaise personne.
                        </p>
                        <p className={paragraphClassName}>
                            Si une autre personne retire la commande, elle doit pouvoir présenter le numéro de commande et une
                            autorisation du client. Le client est invité à vérifier l'état et la conformité des articles lors du
                            retrait et à signaler immédiatement toute anomalie visible.
                        </p>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>9. Droit de rétractation</h2>
                        <p className={paragraphClassName}>
                            Pour les produits non personnalisés, le client dispose d'un délai de quatorze jours à compter de la
                            prise de possession du produit pour exercer son droit de rétractation, sans avoir à justifier sa
                            décision. Il doit envoyer avant l'expiration du délai une déclaration dénuée d'ambiguïté ou le
                            formulaire type figurant à l'article 15 à{" "}
                            <a className="font-bold text-sbc underline" href="mailto:seclinbc@gmail.com">seclinbc@gmail.com</a>.
                        </p>
                        <p className={paragraphClassName}>
                            Le produit doit ensuite être restitué au SBC, à l'adresse indiquée à l'article 1, dans les quatorze
                            jours suivant l'envoi de la décision de rétractation. Les frais directs de retour restent à la charge
                            du client. Le produit peut être manipulé uniquement dans la mesure nécessaire pour en établir la
                            nature, les caractéristiques et le bon fonctionnement. Une dépréciation résultant de manipulations
                            excessives peut être déduite du remboursement.
                        </p>
                        <p className={paragraphClassName}>
                            Le remboursement est effectué avec le même moyen de paiement, sans frais, au plus tard quatorze jours
                            après que le SBC a été informé de la rétractation. Il peut être différé jusqu'à la récupération du
                            produit ou jusqu'à la fourniture d'une preuve de son expédition.
                        </p>
                        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-950">
                            <p className="font-black">Exception pour les articles personnalisés</p>
                            <p className="mt-2 leading-7">
                                Conformément à l'article L. 221-28 du Code de la consommation, le droit de rétractation ne peut
                                pas être exercé pour un article confectionné selon les spécifications du client ou nettement
                                personnalisé, notamment lorsqu'un texte ou un numéro demandé par le client y a été apposé. Cette
                                exception ne prive pas le client des garanties applicables en cas de défaut ou de non-conformité.
                            </p>
                        </div>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>10. Garanties légales et réclamations</h2>
                        <p className={paragraphClassName}>
                            Les produits bénéficient de la garantie légale de conformité prévue aux articles L. 217-3 et suivants
                            du Code de la consommation et de la garantie contre les vices cachés prévue aux articles 1641 et
                            suivants du Code civil. La garantie légale de conformité peut être invoquée pendant deux ans à compter
                            de la délivrance du bien. Elle s'applique également aux personnalisations qui ne correspondent pas à
                            la commande validée.
                        </p>
                        <p className={paragraphClassName}>
                            Toute demande doit être adressée à seclinbc@gmail.com avec le numéro de commande, une description du
                            problème et, si possible, des photographies. Selon les conditions légales, le client peut demander la
                            réparation ou le remplacement du produit ou, lorsque ces solutions sont impossibles ou
                            disproportionnées, une réduction du prix ou la résolution de la vente.
                        </p>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>11. Responsabilité et force majeure</h2>
                        <p className={paragraphClassName}>
                            Le SBC répond de la bonne exécution de ses obligations conformément à la loi. Il ne peut toutefois
                            être tenu responsable d'une inexécution résultant du fait du client, du fait imprévisible et
                            insurmontable d'un tiers au contrat ou d'un événement de force majeure. Aucune disposition des
                            présentes conditions ne limite les droits légaux du consommateur.
                        </p>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>12. Données personnelles</h2>
                        <p className={paragraphClassName}>
                            Le Seclin Basket Club est responsable des traitements nécessaires à la gestion des commandes. Les
                            nom, prénom, adresse électronique, numéro de téléphone, détails de commande, personnalisations et
                            identifiants techniques de paiement sont traités pour conclure et exécuter le contrat, assurer le
                            suivi, gérer les réclamations et respecter les obligations comptables et légales.
                        </p>
                        <p className={paragraphClassName}>
                            Ces informations sont accessibles aux membres habilités du club et, dans la stricte mesure nécessaire,
                            à ses prestataires, notamment Stripe pour le paiement, Resend pour l'envoi des e-mails, Hostinger pour
                            l'hébergement et le fournisseur chargé de préparer les produits. Certains prestataires peuvent traiter
                            des données hors de l'Espace économique européen en mettant en place les garanties prévues par le RGPD.
                        </p>
                        <p className={paragraphClassName}>
                            Les données sont conservées en base active pendant la gestion de la commande, puis archivées pendant
                            les durées nécessaires à la défense des droits du club et au respect de ses obligations, notamment dix
                            ans pour les documents comptables. Le client peut demander l'accès, la rectification, l'effacement,
                            la limitation ou la portabilité de ses données et s'opposer aux traitements qui le permettent en
                            écrivant à seclinbc@gmail.com. Il peut également déposer une réclamation auprès de la CNIL.
                        </p>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>13. Médiation et règlement des litiges</h2>
                        <p className={paragraphClassName}>
                            En cas de difficulté, le client doit d'abord adresser une réclamation écrite au SBC à
                            seclinbc@gmail.com. Si la réponse ne le satisfait pas ou en l'absence de réponse, il peut recourir
                            gratuitement au médiateur de la consommation dont relève le SBC.
                        </p>
                        <div className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-4 text-sm text-orange-950">
                            <strong>À compléter par le bureau avant ouverture :</strong> nom, adresse postale et site internet du
                            médiateur de la consommation préalablement désigné par le club.
                        </div>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>14. Droit applicable</h2>
                        <p className={paragraphClassName}>
                            Les présentes conditions sont soumises au droit français. En l'absence de résolution amiable, le
                            consommateur peut saisir la juridiction compétente selon les règles de procédure applicables. Si une
                            clause est déclarée nulle, les autres clauses restent applicables.
                        </p>
                    </section>

                    <section className={sectionClassName}>
                        <h2 className={titleClassName}>15. Formulaire type de rétractation</h2>
                        <p className={paragraphClassName}>
                            Ce formulaire est à utiliser uniquement pour un produit bénéficiant du droit de rétractation. Il peut
                            être copié et envoyé par e-mail à seclinbc@gmail.com ou par courrier à l'adresse du SBC.
                        </p>
                        <div className="space-y-3 rounded-2xl bg-gray-50 p-5 font-mono text-sm leading-6 text-gray-700">
                            <p>À l'attention du Seclin Basket Club, 7 rue Joliot Curie, 59113 Seclin — seclinbc@gmail.com</p>
                            <p>Je vous notifie par la présente ma rétractation du contrat portant sur la vente du bien suivant :</p>
                            <p>Produit(s) : ................................................................................</p>
                            <p>Numéro de commande : ...................................................................</p>
                            <p>Commandé le / retiré le : ................................................................</p>
                            <p>Nom du client : .............................................................................</p>
                            <p>Adresse du client : .........................................................................</p>
                            <p>Date et signature, uniquement en cas d'envoi papier : ........................................</p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

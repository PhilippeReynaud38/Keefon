// -*- coding: utf-8 -*-
// /pages/confidentialite.tsx — Keefon
// Politique de confidentialité (RGPD) — modèle concis à adapter/compléter
//
// Contexte :
//   - Service Keefon actuellement gratuit, en phase de test/découverte.
//   - Exploitation à titre individuel (pas encore de société dédiée).
//   - Données traitées : compte, profil, photos, interactions, logs, etc.
//   - A FAIRE : compléter les [crochets] avec tes vraies infos (nom, adresse…)
//               et faire relire par un pro quand la société sera créée.
//
// Dernière mise à jour : 03/12/2025

import Head from "next/head";
import Link from "next/link";

export default function Confidentialite() {
  return (
    <>
      <Head>
        <title>Politique de confidentialité — Keefon</title>
        <meta
          name="description"
          content="Politique de confidentialité (RGPD) du site de rencontres Keefon."
        />
        {/* Page d'information : on peut la laisser hors index des moteurs */}
        <meta name="robots" content="noindex,nofollow" />
        <link
          rel="canonical"
          href="https://www.keefon.com/confidentialite"
        />
      </Head>

      <main className="min-h-screen bg-white/70">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">
            Politique de confidentialité (RGPD)
          </h1>

          <p className="text-xs text-gray-500 mb-6">
            Cette page est une base adaptée à la phase actuelle de Keefon
            (service gratuit, en test). Elle devra être complétée et, si
            possible, relue par un professionnel du droit lorsque le projet
            évoluera (création d&apos;une structure juridique, options
            payantes, etc.).
          </p>

          <div className="space-y-5 text-sm leading-relaxed">
            <section>
              <h2 className="font-semibold">1. Qui sommes-nous ?</h2>
              <p>
                <b>Keefon</b> est actuellement édité à titre individuel par{" "}
                <b>[Nom complet de l&apos;éditeur]</b>,{" "}
                <b>[éventuelle mention d&apos;activité / statut]</b>,{" "}
                <b>[adresse postale complète]</b> — contact :{" "}
                <b>[email de contact / DPO]</b>.
              </p>
              <p className="mt-2 text-xs text-gray-600">
                Keefon est en phase de test/découverte. Une structure
                juridique dédiée pourra être créée ultérieurement ; les
                présentes informations seront alors mises à jour.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">2. Données traitées</h2>
              <ul className="list-disc list-inside">
                <li>Compte : email, identifiants, logs d’accès.</li>
                <li>
                  Profil : pseudo, âge/genre, ville/CP, description,
                  préférences, photos (y compris éventuelle photo de
                  certification).
                </li>
                <li>
                  Localisation : ville/CP partagés, zone géographique
                  approximative (pas de géolocalisation GPS fine).
                </li>
                <li>
                  Interactions : likes, messages, coups de cœur,
                  signalements, paramètres de confidentialité.
                </li>
                <li>Technique : IP, appareil, cookies strictement nécessaires.</li>
                <li>
                  Paiements : à ce jour, <b>aucun abonnement payant n&apos;est
                  actif</b>. Si des abonnements sont mis en place plus tard,
                  ils pourront être gérés via un prestataire de paiement
                  (par ex. <b>[Stripe]</b>) ; aucune donnée de carte bancaire
                  ne sera stockée chez Keefon.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold">3. Finalités & bases légales</h2>
              <ul className="list-disc list-inside">
                <li>
                  Fourniture du service (création de compte, affichage des
                  profils, échanges de messages) — <b>exécution du contrat</b>.
                </li>
                <li>
                  Lutte contre la fraude et les abus, sécurisation de la
                  plateforme — <b>intérêt légitime</b>.
                </li>
                <li>
                  Emails d&apos;information ou de conseils —{" "}
                  <b>consentement</b> (désinscription possible à tout moment).
                </li>
                <li>
                  Statistiques et amélioration du service (de manière
                  agrégée) — <b>intérêt légitime</b>.
                </li>
                <li>
                  Abonnements payants (si activés plus tard) —{" "}
                  <b>exécution du contrat</b>.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold">4. Paramètres de confidentialité</h2>
              <p>
                Keefon propose des réglages de confidentialité, par exemple :
              </p>
              <p className="mt-1">
                <b>Mode privé</b> : ton profil est masqué des recherches
                publiques (dans la limite des options disponibles).
                <br />
                <b>Visibilité profils certifiés uniquement</b> : seuls les
                profils ayant une certification peuvent voir ton profil.
              </p>
              <p className="mt-1">
                Tu peux ajuster ces paramètres dans la section{" "}
                <i>Paramètres</i> de ton compte, lorsque ces options sont
                disponibles.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">
                5. Destinataires & sous-traitants
              </h2>
              <p>
                Les données sont principalement traitées par l&apos;éditeur
                de Keefon et ne sont pas revendues à des tiers. Elles peuvent
                être hébergées ou techniquement manipulées par :
              </p>
              <p className="mt-1">
                Hébergement & base : <b>[Supabase / région ou équivalent]</b>.
                <br />
                Front : <b>Vercel</b> (hébergeur de l&apos;application web).
                <br />
                Paiement (si activé plus tard) : <b>[Stripe]</b> ou prestataire
                équivalent.
              </p>
              <p className="mt-1">
                Une liste plus détaillée des sous-traitants peut être fournie
                sur demande.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">6. Transferts hors UE</h2>
              <p>
                Certains prestataires (comme l&apos;hébergeur applicatif ou la
                base de données) peuvent être situés en dehors de l&apos;Union
                européenne ou traiter des données depuis des pays tiers. Lorsque
                c&apos;est le cas, des mesures contractuelles et techniques
                raisonnables sont recherchées (par exemple : clauses
                contractuelles types, sécurité technique, minimisation des
                données).
              </p>
            </section>

            <section>
              <h2 className="font-semibold">
                7. Durées de conservation (principes)
              </h2>
              <ul className="list-disc list-inside">
                <li>
                  Compte actif : pendant l’usage du service. En cas de
                  suppression de compte, certaines données peuvent être
                  anonymisées ou conservées pour une durée limitée pour des
                  raisons légales ou de preuve.
                </li>
                <li>
                  Logs techniques : généralement entre 6 et 12 mois, à des
                  fins de sécurité et d&apos;amélioration du service.
                </li>
                <li>
                  Contenus signalés : pendant la durée nécessaire au
                  traitement du signalement et à la gestion d&apos;éventuels
                  litiges.
                </li>
                <li>
                  Compte supprimé : anonymisation/suppression sous{" "}
                  <b>[délai technique]</b>, hors obligations légales
                  particulières.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold">8. Droits RGPD</h2>
              <p>
                Conformément à la réglementation applicable, tu disposes
                notamment des droits suivants (dans les limites prévues par
                la loi) : accès, rectification, effacement, limitation,
                portabilité, opposition à certains traitements (art. 15 à 21
                du RGPD).
              </p>
              <p className="mt-1">
                Pour exercer ces droits, tu peux écrire à :{" "}
                <b>[email de contact RGPD]</b> (une pièce d&apos;identité
                pourra être demandée en cas de doute). Tu peux également
                introduire une réclamation auprès de l&apos;autorité de
                contrôle compétente (en France :{" "}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  CNIL
                </a>
                ).
              </p>
            </section>

            <section>
              <h2 className="font-semibold">9. Cookies</h2>
              <p>
                Keefon utilise principalement des cookies et traceurs
                strictement nécessaires au fonctionnement du site (session,
                sécurité, préférences de base). Une description plus détaillée
                des cookies utilisés est disponible sur la page{" "}
                <Link href="/cookies" className="underline">
                  Politique cookies
                </Link>
                .
              </p>
              <p className="mt-1">
                D&apos;éventuels cookies supplémentaires (par exemple pour des
                statistiques avancées ou du marketing) ne seraient activés
                qu&apos;avec ton consentement explicite, via un bandeau ou un
                module dédié, si ces fonctionnalités sont mises en place.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">10. Sécurité</h2>
              <p>
                Des mesures techniques et organisationnelles raisonnables sont
                mises en œuvre pour protéger les données (chiffrement des
                connexions, contrôle d&apos;accès, journaux, sauvegardes,
                etc.). Aucune mesure de sécurité n&apos;étant absolue, il est
                recommandé de choisir un mot de passe robuste et de ne pas le
                réutiliser sur d&apos;autres services.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">11. Contact</h2>
              <p>
                Pour toute question relative à cette politique ou à tes
                données personnelles :
              </p>
              <p className="mt-1">
                <b>[Nom / DPO / contact]</b> — <b>[email]</b> —{" "}
                <b>[adresse postale]</b>.
              </p>
            </section>

            <p className="text-gray-500">
              Dernière mise à jour : <b>03/12/2025</b>.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

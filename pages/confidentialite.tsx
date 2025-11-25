// -*- coding: utf-8 -*-
// /pages/confidentialite.tsx — Vivaya
// Politique de confidentialité (RGPD) — modèle concis à adapter/compléter

import Head from "next/head";

export default function Confidentialite() {
  return (
    <>
      <Head>
        <title>Politique de confidentialité — Vivaya</title>
        <meta name="description" content="Politique de confidentialité (RGPD) de Vivaya." />
      </Head>

      <main className="min-h-screen bg-white/70">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">Politique de confidentialité (RGPD)</h1>

          <div className="space-y-5 text-sm leading-relaxed">
            <section>
              <h2 className="font-semibold">1. Qui sommes-nous ?</h2>
              <p><b>Vivaya</b> est édité par <b>[Éditeur / Entreprise]</b>, <b>[forme juridique]</b>, <b>[adresse]</b> — contact : <b>[email/DPO]</b>.</p>
            </section>

            <section>
              <h2 className="font-semibold">2. Données traitées</h2>
              <ul className="list-disc list-inside">
                <li>Compte : email, identifiants, logs d’accès.</li>
                <li>Profil : pseudo, âge/genre, ville/CP, description, préférences, photos (y c. certification).</li>
                <li>Localisation : ville/CP partagés, historique si activé.</li>
                <li>Interactions : likes, messages, signalements, paramètres de confidentialité.</li>
                <li>Technique : IP, device, cookies strictement nécessaires.</li>
                <li>Paiements (si abonnement) via <b>[Stripe]</b> — pas de stockage de carte chez Vivaya.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold">3. Finalités & bases légales</h2>
              <ul className="list-disc list-inside">
                <li>Fourniture du service — exécution du contrat.</li>
                <li>Lutte contre la fraude/abus — intérêt légitime.</li>
                <li>Emails actu/conseils — consentement (désinscription possible).</li>
                <li>Statistiques & amélioration — intérêt légitime.</li>
                <li>Abonnements — exécution du contrat.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold">4. Paramètres de confidentialité</h2>
              <p><b>Mode privé</b> : ton profil est masqué. <br />
                 <b>Visibilité certifiés uniquement</b> : seuls les profils certifiés te voient. Réglages dans <i>Paramètres</i>.</p>
            </section>

            <section>
              <h2 className="font-semibold">5. Destinataires & sous-traitants</h2>
              <p>Hébergement & base : <b>[Supabase / région]</b>. Front : <b>[Vercel/Netlify]</b>. Paiement : <b>[Stripe]</b>. 
                 Liste détaillée disponible sur demande.</p>
            </section>

            <section>
              <h2 className="font-semibold">6. Transferts hors UE</h2>
              <p>Encadrés par des clauses contractuelles types (CCT) ou garanties équivalentes.</p>
            </section>

            <section>
              <h2 className="font-semibold">7. Durées de conservation (principes)</h2>
              <ul className="list-disc list-inside">
                <li>Compte actif : pendant l’usage.</li>
                <li>Logs techniques : 6–12 mois.</li>
                <li>Contenus signalés : durée nécessaire au traitement.</li>
                <li>Compte supprimé : anonymisation/suppression sous <b>[délai technique]</b> hors obligations légales.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold">8. Droits RGPD</h2>
              <p>Accès, rectification, effacement, limitation, portabilité, opposition (art. 15 à 21).  
                 Exercice des droits : <b>[email]</b> (pièce d’identité possible). Réclamation : <b>CNIL</b>.</p>
            </section>

            <section>
              <h2 className="font-semibold">9. Cookies</h2>
              <p>Cookies strictement nécessaires. Autres (audience/marketing) uniquement avec consentement, si activés.</p>
            </section>

            <section>
              <h2 className="font-semibold">10. Sécurité</h2>
              <p>Mesures techniques & organisationnelles raisonnables (TLS, contrôle d’accès, journaux, sauvegardes). Aucune sécurité n’est absolue.</p>
            </section>

            <section>
              <h2 className="font-semibold">11. Contact</h2>
              <p><b>[Nom / DPO]</b> — <b>[email]</b> — <b>[adresse]</b>.</p>
            </section>

            <p className="text-gray-500">Dernière mise à jour : <b>[JJ/MM/AAAA]</b>.</p>
          </div>
        </div>
      </main>
    </>
  );
}

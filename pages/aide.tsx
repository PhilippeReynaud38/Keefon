// -*- coding: utf-8 -*-
// Vivaya — pages/aide.tsx
//
// Objet : page d’aide centrée sur les interactions :
//  - Signification des boutons 👍❤️📣🧡💬🛡️🚩
//  - Fonctionnement de la page Messages (Conversations en cours / Messages reçus)
// Règles : page statique, sans accès base de données, texte court et clair, facile à maintenir.

import Link from "next/link";

export default function Aide() {
  return (
    <div
      className="min-h-screen bg-cover bg-center p-4 flex flex-col"
      style={{ backgroundImage: "url('/bg-dashboard-ext.png')" }}
    >
      <main className="w-full max-w-2xl mx-auto bg-white/90 rounded-2xl shadow-lg p-5 mt-6 mb-8">
        <header className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-purple-700 text-center">
            Aide sur tes interactions
          </h1>
          <p className="mt-2 text-sm text-gray-700 text-center">
            Ici, tu trouves l&apos;essentiel pour comprendre les boutons
            d&apos;action et le fonctionnement de la page Messages. L&apos;objectif :
            que tu saches rapidement sur quoi appuyer et ce qui se passe
            derrière.
          </p>
        </header>

        {/* 1. Légende des boutons */}
        <section className="mt-4 space-y-4 text-sm text-gray-800">
          <div>
            <h2 className="font-semibold text-purple-700">
              1. Les boutons d&apos;action sur les profils
            </h2>
            <p className="mt-1">
              Sur les cartes profil ou dans certaines listes, tu peux voir ces
              boutons&nbsp;:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <span className="font-semibold">👍 Like</span> : si un profil
                t&apos;intéresse, tu le ranges en favori dans{" "}
                <Link
                  href="/interaction/mes-likes"
                  className="text-purple-700 hover:underline font-semibold"
                >
                  Mes likes
                </Link>{" "}
                pour éventuellement discuter plus tard.
              </li>
              <li>
                <span className="font-semibold">❤️ / 🧡 Keef</span> : Tu peux
                envoyer un cœur à un profil qui te plaît, s&apos;il te répond
                avec un autre cœur, alors vous avez un Keef mutuel et la
                conversation s&apos;ouvre immédiatement, même si vous
                n&apos;êtes pas abonné. Un profil non abonné ne voit pas qui
                envoie les cœurs. Si tu envoies un écho à un profil abonné,
                celui-ci n&apos;est pas consommé.{" "}
                <Link
                  href="/interaction/mes_coups_de_coeur"
                  className="text-purple-700 hover:underline"
                >
                  Mes Keefs
                </Link>
                .
              </li>
              <li>
                <span className="font-semibold">📣 Echo</span> : tu peux envoyer
                un écho à un profil, toujours accompagné d&apos;un cœur. Si la
                personne te renvoie ton écho, la conversation s&apos;ouvre,
                même si vous n&apos;êtes pas abonné. Attention : la personne qui
                reçoit l&apos;écho découvre qui l&apos;a envoyé seulement après
                avoir répondu et peut décider de couper court à la conversation
                immédiatement.
              </li>
              <li>
                <span className="font-semibold">💬 Message</span> : ouvre ou
                continue une conversation avec la personne. Tu retrouves tous
                tes échanges dans{" "}
                <Link
                  href="/interaction/messages"
                  className="text-purple-700 hover:underline"
                >
                  Mes messages
                </Link>
                .
              </li>
              <li>
                <span className="font-semibold">🛡️ Bloquer</span> : coupe tout
                contact avec ce profil. Vous ne pouvez plus vous écrire ni vous
                voir dans les suggestions. À utiliser si tu ne veux plus être
                contacté.
              </li>
              <li>
                <span className="font-semibold">🚩 Signaler</span> : à utiliser
                en cas de comportement inapproprié, suspicion de faux profil,
                manque de respect, etc. Cela permet de remonter le profil à
                l&apos;équipe de modération.
              </li>
            </ul>
          </div>

          {/* 2. Page Messages : structure */}
          <div>
            <h2 className="font-semibold text-purple-700">
              2. La page &quot;Mes messages&quot;
            </h2>
            <p className="mt-1">
              La page{" "}
              <Link
                href="/interaction/messages"
                className="text-purple-700 hover:underline"
              >
                Mes messages
              </Link>{" "}
              est séparée en deux parties principales&nbsp;:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <span className="font-semibold">Conversations en cours</span> :
                ce sont les conversations avec des personnes avec qui tu
                discutes déjà.
              </li>
              <li>
                <span className="font-semibold">Messages reçus</span> : ce sont
                les nouveaux messages, dès que tu réponds, la conversation
                bascule dans{" "}
                <span className="font-semibold">Conversations en cours</span>.
              </li>
            </ul>
          </div>

          {/* 3. Indicateurs visuels (ex. pastille "Nouveau") */}
          <div>
            <h2 className="font-semibold text-purple-700">
              3. Indicateurs de nouveaux messages
            </h2>
            <p className="mt-1">
              Sur certains fils, tu peux voir une pastille verte{" "}
              <span className="font-semibold">Nouveau</span>. Cela veut dire
              qu&apos;il y a au moins un message non lu dans cette conversation.
            </p>
            <p className="mt-1">
              Ouvre simplement le fil pour lire le message ; la pastille
              disparaîtra automatiquement.
            </p>
          </div>
        </section>

        {/* Bas de page : retour simple */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold shadow hover:bg-purple-700"
          >
            ← Retour au Tableau de bord
          </Link>
          <p className="text-[11px] text-gray-600 text-center sm:text-right">
            Pour les aspects juridiques (CGU, mentions légales), tu peux
            consulter les liens en bas de ton espace Keefon.
          </p>
        </div>
      </main>
    </div>
  );
}

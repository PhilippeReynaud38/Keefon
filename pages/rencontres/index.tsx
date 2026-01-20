// pages/rencontres/index.tsx
import Head from "next/head";
import Link from "next/link";

const cities = [
  { slug: "paris", label: "Paris" },
  { slug: "lyon", label: "Lyon" },
  { slug: "marseille", label: "Marseille" },
  { slug: "toulouse", label: "Toulouse" },
  { slug: "nice", label: "Nice" },
  { slug: "nantes", label: "Nantes" },
  { slug: "montpellier", label: "Montpellier" },
  { slug: "strasbourg", label: "Strasbourg" },
  { slug: "bordeaux", label: "Bordeaux" },
  { slug: "lille", label: "Lille" },
  { slug: "rennes", label: "Rennes" },
  { slug: "grenoble", label: "Grenoble" },
  { slug: "saint-etienne", label: "Saint-Étienne" },
];

export default function RencontresHub() {
  return (
    <>
      <Head>
        <title>Rencontres en France – Villes & régions | Keefon</title>
        <meta
          name="description"
          content="Choisissez votre ville pour découvrir les rencontres locales sur Keefon, ou accédez à la page France."
        />
        <link rel="canonical" href="https://www.keefon.com/rencontres" />
      </Head>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <h1>Rencontres en France</h1>
        <p>Choisis une page :</p>

        <ul style={{ lineHeight: 1.9 }}>
          <li>
            <Link href="/rencontres/france">France (toutes les villes)</Link>
          </li>
          {cities.map((c) => (
            <li key={c.slug}>
              <Link href={`/rencontres/${c.slug}`}>{c.label}</Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

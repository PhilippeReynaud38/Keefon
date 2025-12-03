// pages/index.tsx
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/rencontres/France",
      permanent: true, // 308/301 SEO friendly
    },
  };
};

export default function HomeRedirect() {
  // Fallback très simple si jamais la redirection ne part pas
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#A8FF3B]">
      <div className="text-center px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-pink-600">
          Keefon
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-800">
          Redirection vers la page d’accueil Keefon France…
        </p>
        <p className="mt-3 text-sm text-gray-800">
          Si rien ne se passe, clique ici&nbsp;:{" "}
          <a href="/rencontres/France" className="underline font-semibold">
            /rencontres/France
          </a>
        </p>
      </div>
    </div>
  );
}

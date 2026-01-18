// pages/index.tsx
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/rencontres/france",
      permanent: true,
    },
  };
};

export default function HomeRedirect() {
  return null;
}

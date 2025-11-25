// UTF-8
// pages/admin/essentiel-global.tsx

import dynamic from "next/dynamic";
const EssentielGlobalToggle = dynamic(() => import("../../components/admin/EssentielGlobalToggle"), { ssr: false });

export default function EssentielGlobalPage() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Paramètres globaux</h1>
      <EssentielGlobalToggle />
    </main>
  );
}

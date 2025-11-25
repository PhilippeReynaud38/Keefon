// UTF-8 – Bouton Vivaya – Version sans dépendance externe
// ✅ variant='solid' ou 'outline'
// ✅ Palette orangeVivaya + Tailwind pur
// ✅ Aucun gadget – simple, logique, maintenable

import { ReactNode } from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline';
  children: ReactNode;
}

export default function Button({ variant = 'solid', children, ...props }: Props) {
  const base =
    variant === 'solid'
      ? 'bg-orangeVivaya text-white px-4 py-2 rounded hover:bg-orange-500 transition'
      : 'border border-orangeVivaya text-orangeVivaya px-4 py-2 rounded hover:bg-orangeVivaya hover:text-white transition';

  return (
    <button className={base} {...props}>
      {children}
    </button>
  );
}

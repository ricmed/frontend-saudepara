import { Link } from 'react-router-dom';
import { BarChart3, Database } from 'lucide-react';

/** Atalhos para subpáginas — uso opcional fora da home (hero já cobre CTAs). */
const LINKS = [
  { to: '/observasus/paineis', label: 'Painéis', icon: BarChart3 },
  { to: '/observasus/dados', label: 'DataStorage', icon: Database },
] as const;

export function ObservaSusQuickNav() {
  return (
    <nav aria-label="Atalhos do ObservaSUS" className="flex flex-wrap gap-2">
      {LINKS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-800"
        >
          <Icon className="h-4 w-4 text-blue-600" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

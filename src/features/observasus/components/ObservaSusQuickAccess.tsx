import { useNavigate } from 'react-router-dom';
import { Book, Heart, Map, MessageCircle } from 'lucide-react';
import type { ObservaSusQuickLink } from '../types/observasus';

const QUICK_ICONS = {
  map: Map,
  heart: Heart,
  book: Book,
  message: MessageCircle,
} as const;

interface ObservaSusQuickAccessProps {
  links: ObservaSusQuickLink[];
}

export function ObservaSusQuickAccess({ links }: ObservaSusQuickAccessProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {links.map((link) => {
        const Icon = QUICK_ICONS[link.icon];
        return (
          <button
            key={link.route}
            type="button"
            onClick={() => navigate(link.route)}
            className="group text-left rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-5 transition hover:bg-white/20 hover:border-white/40"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="font-bold text-white">{link.title}</h3>
            <p className="mt-1 text-sm text-blue-100 leading-relaxed">{link.description}</p>
          </button>
        );
      })}
    </div>
  );
}

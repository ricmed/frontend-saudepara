import { FaMosquito } from 'react-icons/fa6';
import type { IconBaseProps } from 'react-icons';

/** Mosquito — Font Awesome via react-icons (Lucide ainda não tem este ícone). */
export function MosquitoIcon({ className, ...props }: IconBaseProps) {
  return <FaMosquito className={className} aria-hidden {...props} />;
}

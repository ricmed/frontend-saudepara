import { FormEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Aviso({ tipo, children }: { tipo: 'erro' | 'ok' | 'info'; children: ReactNode }) {
  const classe = tipo === 'erro' ? 'bg-red-50 text-red-800 border-red-200' : tipo === 'ok' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-blue-50 text-blue-800 border-blue-200';
  return <div className={`border rounded-md px-3 py-2 text-sm ${classe}`}>{children}</div>;
}

export function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-gray-700">
      <span className="font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function CampoCheck({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      {children}
      <span className="font-medium">{label}</span>
    </label>
  );
}

export const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white';

export function Botao({ children, type = 'button', onClick, disabled }: { children: ReactNode; type?: 'button' | 'submit'; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="whitespace-nowrap rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
      {children}
    </button>
  );
}

export function BotaoSecundario({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:opacity-50">
      {children}
    </button>
  );
}

export function Cartao({ titulo, children, acoes }: { titulo: string; children: ReactNode; acoes?: ReactNode }) {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">{titulo}</h2>
        {acoes}
      </div>
      {children}
    </section>
  );
}

export function Tabela({ colunas, children }: { colunas: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            {colunas.map((coluna) => <th key={coluna} className="py-2 pr-3 font-medium">{coluna}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Linha({
  children,
  onClick,
  selecionada,
}: {
  children: ReactNode;
  onClick?: () => void;
  selecionada?: boolean;
}) {
  return (
    <tr
      className={`border-b border-gray-100 align-top ${onClick ? 'cursor-pointer hover:bg-blue-50' : ''} ${selecionada ? 'bg-blue-50' : ''}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function Celula({ children }: { children: ReactNode }) {
  return <td className="py-2 pr-3">{children}</td>;
}

export function Formulario({ onSubmit, children }: { onSubmit: (event: FormEvent) => void; children: ReactNode }) {
  return <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">{children}</form>;
}

export function Modal({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onFechar} role="dialog" aria-modal="true" aria-labelledby="mp-modal-titulo">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 shadow-lg" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="mp-modal-titulo" className="text-lg font-semibold text-gray-900">{titulo}</h2>
          <button type="button" onClick={onFechar} className="rounded-md px-2 py-1 text-lg leading-none text-gray-500 hover:bg-gray-100" aria-label="Fechar">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

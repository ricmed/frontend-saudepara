import React from 'react';
import { Facebook, Instagram, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-blue-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Contato</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2 text-pink-500">📍</span>
                <span>Tv. Lomas Valentinas, 2190 – Marco, Belém – PA, CEP: 66093-677</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-red-500">📞</span>
                <span>(91) 4006-4200</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-400">✉️</span>
                <span>http://www.saude.pa.gov.br</span>
              </li>
            </ul>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="h-10 w-10 rounded-full bg-[#3B5998] flex items-center justify-center hover:opacity-90 transition">
                <Facebook className="h-5 w-5 text-white" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-[#C13584] flex items-center justify-center hover:opacity-90 transition">
                <Instagram className="h-5 w-5 text-white" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-black flex items-center justify-center hover:opacity-90 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-[#FF0000] flex items-center justify-center hover:opacity-90 transition">
                <Youtube className="h-5 w-5 text-white" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">Horário de Atendimento</h3>
            <p>Segunda a Sexta: 08:00 às 18:00</p>
            <p className="mt-4">Secretaria de Estado da Saúde do Pará – SESPA, criada pela lei Nº 400, de 30 de agosto de 1951, como órgão da administração direta do estado.</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">Ouvidoria</h3>
            <p>Tem alguma sugestão ou reclamação?</p>
            <p className="mt-2">Entre em contato com nossa ouvidoria:</p>
            <p className="mt-2">📞 0800-123-4567</p>
            <p className="mt-2">✉️ ouvidoria@saude.pa.gov.br</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">Portal Saúde Pará</h3>
            <p>Acesse informações, serviços e notícias sobre saúde pública no estado do Pará.</p>
            <p className="mt-2">Desenvolvido pela Secretaria de Estado de Saúde Pública do Pará (SESPA).</p>
          </div>
        </div>
        <div className="text-center text-sm border-t border-white/20 pt-6">
          <p>© 2025 Secretaria de Estado de Saúde Pública do Pará - Todos os direitos reservados</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
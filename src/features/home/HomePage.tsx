import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from './components/Header';
import { MenuGrid } from './components/MenuGrid';
import { PointsOfInterest } from './components/PointsOfInterest';
import { BottomNavigation } from './components/BottomNavigation';
import { SideMenu } from './components/SideMenu';
import { Carousel } from './components/Carousel';

const PaginaNotificacoes: React.FC = () => {
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const [currentTab, setCurrentTab] = useState("inicio");
 const { selectedLanguage, setSelectedLanguage } = useLanguage();
 const [currentSlide, setCurrentSlide] = useState(0);

 return (
   <div className="max-w-md mx-auto">
     <div className="border-8 border-gray-800 rounded-[2.5rem] overflow-hidden h-[720px] relative bg-gray-50">
       {/* Notch */}
       <div className="bg-gray-800 h-6 w-40 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl"></div>
       
       <div className="h-full relative">
         <div className="h-full overflow-y-auto pb-20">
           {/* Header com Carrossel */}
           <Header 
             isMenuOpen={isMenuOpen} 
             onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
             currentSlide={currentSlide}
             onSlideChange={setCurrentSlide}
           >
             <Carousel />
           </Header>
           
           {/* Grid de Menu */}
           <MenuGrid />
           
           {/* Pontos de Interesse */}
           <PointsOfInterest />
         </div>
         
         {/* Navegação Inferior */}
         <BottomNavigation 
           currentTab={currentTab}
           onTabChange={setCurrentTab}
         />
         
         {/* Menu Lateral */}
         <SideMenu 
           isOpen={isMenuOpen}
           onClose={() => setIsMenuOpen(false)}
           selectedLanguage={selectedLanguage}
           onLanguageChange={setSelectedLanguage}
         />
       </div>
     </div>
   </div>
 );
};

export default PaginaNotificacoes;
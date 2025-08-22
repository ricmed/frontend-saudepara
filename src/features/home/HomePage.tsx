import React, { useState } from 'react';
import { Header } from './components/Header';
import { MenuGrid } from './components/MenuGrid';
import { PointsOfInterest } from './components/PointsOfInterest';
import { BottomNavigation } from './components/BottomNavigation';
import { SideMenu } from './components/SideMenu';
import { Carousel } from './components/Carousel';

const PaginaNotificacoes: React.FC = () => {
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const [currentTab, setCurrentTab] = useState("inicio");
 const [currentSlide, setCurrentSlide] = useState(0);

 return (
   <div className="w-full min-h-screen bg-gray-50">
     {/* Container responsivo sem simulação de dispositivo */}
     <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto relative bg-gray-50 min-h-screen">
       <div className="h-full relative">
         <div className="min-h-screen overflow-y-auto pb-20">
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
         />
       </div>
     </div>
   </div>
 );
};

export default PaginaNotificacoes;
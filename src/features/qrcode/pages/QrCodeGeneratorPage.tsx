import React, { useState, useMemo } from 'react';
import { AppPageLayout } from '@/components/layouts/AppPageLayout';
import { QrCodeForm } from '../components/QrCodeForm';
import { QrCodePreview } from '../components/QrCodePreview';
import { QrCodeType, QrCodeData } from '../types';

export default function QrCodeGeneratorPage() {
  const [activeTab, setActiveTab] = useState<QrCodeType>('url');
  const [qrData, setQrData] = useState<QrCodeData>({
    url: '',
    text: '',
    wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
    instagram: { username: '' },
    facebook: { urlOrUsername: '' },
    whatsapp: { phone: '', message: '' },
    colors: { useGradient: false, gradientType: 'none', qrColor: '#000000', bgColor: '#FFFFFF', textColor: '#000000' }
  });
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [topText, setTopText] = useState<string>('');
  const [bottomText, setBottomText] = useState<string>('');

  const finalQrCodeString = useMemo(() => {
    if (activeTab === 'url') {
      return qrData.url;
    }
    if (activeTab === 'text') {
      return qrData.text;
    }
    if (activeTab === 'wifi') {
      const { ssid, encryption, password, hidden } = qrData.wifi;
      if (!ssid) return ''; // Não gerar QR Code de Wifi sem nome de rede
      
      const p = password ? password : '';
      const t = encryption === 'nopass' ? 'nopass' : encryption;
      const h = hidden ? 'true' : 'false';
      
      // Formato MECARD para Wi-Fi
      return `WIFI:S:${ssid};T:${t};P:${p};H:${h};;`;
    }
    if (activeTab === 'instagram') {
      const username = qrData.instagram.username.replace('@', '');
      return username ? `https://instagram.com/${username}` : '';
    }
    if (activeTab === 'facebook') {
      const user = qrData.facebook.urlOrUsername;
      if (!user) return '';
      return user.includes('facebook.com') ? user : `https://facebook.com/${user}`;
    }
    if (activeTab === 'whatsapp') {
      const phone = qrData.whatsapp.phone.replace(/\D/g, '');
      if (!phone) return '';
      const textParam = qrData.whatsapp.message ? `?text=${encodeURIComponent(qrData.whatsapp.message)}` : '';
      return `https://wa.me/${phone}${textParam}`;
    }
    return '';
  }, [activeTab, qrData]);

  return (
    <AppPageLayout 
      title="Gerador de QR Code" 
      variant="desktop"
      showBackButton={true}
    >
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Crie seu QR Code Personalizado</h2>
          <p className="text-gray-600">Selecione o tipo de conteúdo, preencha as informações e baixe sua imagem pronta para uso.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          <div className="flex flex-col">
            <QrCodeForm 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              qrData={qrData}
              setQrData={setQrData}
              customLogo={customLogo}
              setCustomLogo={setCustomLogo}
              topText={topText}
              setTopText={setTopText}
              bottomText={bottomText}
              setBottomText={setBottomText}
            />
          </div>
          
          <div className="flex flex-col">
            <QrCodePreview 
              finalQrCodeString={finalQrCodeString}
              customLogo={customLogo}
              topText={topText}
              bottomText={bottomText}
              colors={qrData.colors}
            />
          </div>
        </div>
      </div>
    </AppPageLayout>
  );
}

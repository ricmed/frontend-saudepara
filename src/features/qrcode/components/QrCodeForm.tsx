import React from 'react';
import { QrCodeType, QrCodeData, WifiEncryption } from '../types';
import { Link, Type, Wifi, Image as ImageIcon, X, Instagram, Facebook, MessageCircle, Palette } from 'lucide-react';
import { toast } from 'react-toastify';

interface QrCodeFormProps {
  activeTab: QrCodeType;
  setActiveTab: (tab: QrCodeType) => void;
  qrData: QrCodeData;
  setQrData: React.Dispatch<React.SetStateAction<QrCodeData>>;
  customLogo: string | null;
  setCustomLogo: (logo: string | null) => void;
  topText: string;
  setTopText: (text: string) => void;
  bottomText: string;
  setBottomText: (text: string) => void;
}

const SOCIAL_LOGOS = {
  instagram: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.98a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>')}`,
  facebook: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>')}`,
  whatsapp: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>')}`
};

export function QrCodeForm({
  activeTab,
  setActiveTab,
  qrData,
  setQrData,
  customLogo,
  setCustomLogo,
  topText,
  setTopText,
  bottomText,
  setBottomText
}: QrCodeFormProps) {

  const handleTabChange = (tab: QrCodeType) => {
    setActiveTab(tab);
    
    const isSocialTab = tab === 'instagram' || tab === 'facebook' || tab === 'whatsapp';
    const isCurrentLogoPreloaded = customLogo && Object.values(SOCIAL_LOGOS).includes(customLogo);
    
    if (isSocialTab) {
      if (!customLogo || isCurrentLogoPreloaded) {
        setCustomLogo(SOCIAL_LOGOS[tab as keyof typeof SOCIAL_LOGOS]);
      }
    } else {
      if (isCurrentLogoPreloaded) {
        setCustomLogo(null);
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setCustomLogo(event.target?.result as string);
    reader.readAsDataURL(file);
    // Reset input value to allow uploading the same file again if removed
    e.target.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
      <div className="mb-6 space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Básico</label>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => handleTabChange('url')}
            className={`flex-1 py-2 px-2 rounded-md flex items-center justify-center gap-2 font-medium text-sm transition-colors ${activeTab === 'url' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-blue-600'}`}
            type="button"
          >
            <Link size={16} /> URL
          </button>
          <button
            onClick={() => handleTabChange('text')}
            className={`flex-1 py-2 px-2 rounded-md flex items-center justify-center gap-2 font-medium text-sm transition-colors ${activeTab === 'text' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-blue-600'}`}
            type="button"
          >
            <Type size={16} /> Texto
          </button>
          <button
            onClick={() => handleTabChange('wifi')}
            className={`flex-1 py-2 px-2 rounded-md flex items-center justify-center gap-2 font-medium text-sm transition-colors ${activeTab === 'wifi' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-blue-600'}`}
            type="button"
          >
            <Wifi size={16} /> Wi-Fi
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Redes Sociais</label>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => handleTabChange('instagram')}
            className={`flex-1 py-2 px-2 rounded-md flex items-center justify-center gap-2 font-medium text-sm transition-colors ${activeTab === 'instagram' ? 'bg-pink-600 text-white shadow' : 'text-gray-600 hover:text-pink-600'}`}
            type="button"
          >
            <Instagram size={16} /> Instagram
          </button>
          <button
            onClick={() => handleTabChange('facebook')}
            className={`flex-1 py-2 px-2 rounded-md flex items-center justify-center gap-2 font-medium text-sm transition-colors ${activeTab === 'facebook' ? 'bg-blue-700 text-white shadow' : 'text-gray-600 hover:text-blue-700'}`}
            type="button"
          >
            <Facebook size={16} /> Facebook
          </button>
          <button
            onClick={() => handleTabChange('whatsapp')}
            className={`flex-1 py-2 px-2 rounded-md flex items-center justify-center gap-2 font-medium text-sm transition-colors ${activeTab === 'whatsapp' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:text-green-600'}`}
            type="button"
          >
            <MessageCircle size={16} /> WhatsApp
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {activeTab === 'url' && (
          <div>
            <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-1">
              Endereço (URL)
            </label>
            <input
              id="url-input"
              type="url"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="https://exemplo.com"
              value={qrData.url}
              onChange={(e) => setQrData({ ...qrData, url: e.target.value })}
            />
          </div>
        )}

        {activeTab === 'text' && (
          <div>
            <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-1">
              Texto
            </label>
            <textarea
              id="text-input"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Digite o texto para o QR Code..."
              value={qrData.text}
              onChange={(e) => setQrData({ ...qrData, text: e.target.value })}
            />
          </div>
        )}

        {activeTab === 'wifi' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="wifi-ssid" className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Rede (SSID)
              </label>
              <input
                id="wifi-ssid"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="Ex: MinhaRedeWiFi"
                value={qrData.wifi.ssid}
                onChange={(e) => setQrData({ ...qrData, wifi: { ...qrData.wifi, ssid: e.target.value } })}
              />
            </div>
            <div>
              <label htmlFor="wifi-password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="wifi-password"
                type="password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="Sua senha"
                value={qrData.wifi.password}
                onChange={(e) => setQrData({ ...qrData, wifi: { ...qrData.wifi, password: e.target.value } })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="wifi-encryption" className="block text-sm font-medium text-gray-700 mb-1">
                  Criptografia
                </label>
                <select
                  id="wifi-encryption"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  value={qrData.wifi.encryption}
                  onChange={(e) => setQrData({ ...qrData, wifi: { ...qrData.wifi, encryption: e.target.value as WifiEncryption } })}
                >
                  <option value="WPA">WPA/WPA2/WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Nenhuma</option>
                </select>
              </div>
              <div className="flex flex-col justify-end pb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    checked={qrData.wifi.hidden}
                    onChange={(e) => setQrData({ ...qrData, wifi: { ...qrData.wifi, hidden: e.target.checked } })}
                  />
                  <span className="text-sm font-medium text-gray-700">Rede Oculta</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'instagram' && (
          <div>
            <label htmlFor="instagram-input" className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Usuário (@)
            </label>
            <input
              id="instagram-input"
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:outline-none"
              placeholder="@saudepara"
              value={qrData.instagram.username}
              onChange={(e) => setQrData({ ...qrData, instagram: { username: e.target.value } })}
            />
          </div>
        )}

        {activeTab === 'facebook' && (
          <div>
            <label htmlFor="facebook-input" className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Usuário ou Link
            </label>
            <input
              id="facebook-input"
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:outline-none"
              placeholder="saudepara (ou cole a URL)"
              value={qrData.facebook.urlOrUsername}
              onChange={(e) => setQrData({ ...qrData, facebook: { urlOrUsername: e.target.value } })}
            />
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="whatsapp-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Número do Celular (com DDD)
              </label>
              <input
                id="whatsapp-phone"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="Ex: 11999999999"
                value={qrData.whatsapp.phone}
                onChange={(e) => setQrData({ ...qrData, whatsapp: { ...qrData.whatsapp, phone: e.target.value } })}
              />
            </div>
            <div>
              <label htmlFor="whatsapp-message" className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem Padrão (Opcional)
              </label>
              <textarea
                id="whatsapp-message"
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="Ex: Olá, gostaria de mais informações..."
                value={qrData.whatsapp.message}
                onChange={(e) => setQrData({ ...qrData, whatsapp: { ...qrData.whatsapp, message: e.target.value } })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6 mb-6">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
          <Palette size={20} className="text-gray-500" />
          Aparência e Cores
        </h3>

        {['instagram', 'facebook', 'whatsapp'].includes(activeTab) && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Cores Temáticas ({activeTab.charAt(0).toUpperCase() + activeTab.slice(1)})
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setQrData({ ...qrData, colors: { ...qrData.colors, useGradient: true, gradientType: activeTab as any } })}
                className={`w-8 h-8 rounded-full shadow-sm border-2 transition-transform hover:scale-110 flex items-center justify-center text-white font-bold text-xs ${qrData.colors.useGradient && qrData.colors.gradientType === activeTab ? 'border-gray-800 ring-2 ring-gray-300 ring-offset-1' : 'border-gray-200'}`}
                style={{ 
                  background: activeTab === 'instagram' ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' :
                              activeTab === 'facebook' ? 'linear-gradient(45deg, #00c6ff, #0072ff)' :
                              'linear-gradient(45deg, #128C7E, #25D366)'
                }}
                title={`Gradiente Oficial ${activeTab}`}
              >G</button>

              {(activeTab === 'instagram' ? ['#E1306C', '#F56040', '#833AB4', '#C13584', '#405DE6'] :
                activeTab === 'facebook' ? ['#1877F2', '#4267B2', '#3b5998', '#8b9dc3', '#000000'] :
                ['#25D366', '#128C7E', '#075E54', '#34B7F1', '#000000']
              ).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setQrData({ ...qrData, colors: { ...qrData.colors, qrColor: color, useGradient: false } })}
                  className={`w-8 h-8 rounded-full shadow-sm border-2 transition-transform hover:scale-110 ${!qrData.colors.useGradient && qrData.colors.qrColor.toUpperCase() === color.toUpperCase() ? 'border-gray-800 ring-2 ring-gray-300 ring-offset-1' : 'border-gray-200'}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Clique em uma cor para aplicar ao QR Code</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cor Personalizada do QR Code</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-10 h-10 p-1 rounded border border-gray-300 cursor-pointer"
                value={qrData.colors.qrColor}
                onChange={(e) => setQrData({ ...qrData, colors: { ...qrData.colors, qrColor: e.target.value, useGradient: false } })}
              />
              <span className="text-sm font-mono text-gray-500 uppercase">{qrData.colors.qrColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cor do Fundo</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-10 h-10 p-1 rounded border border-gray-300 cursor-pointer"
                value={qrData.colors.bgColor}
                onChange={(e) => setQrData({ ...qrData, colors: { ...qrData.colors, bgColor: e.target.value } })}
              />
              <span className="text-sm font-mono text-gray-500 uppercase">{qrData.colors.bgColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cor dos Textos</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-10 h-10 p-1 rounded border border-gray-300 cursor-pointer"
                value={qrData.colors.textColor}
                onChange={(e) => setQrData({ ...qrData, colors: { ...qrData.colors, textColor: e.target.value } })}
              />
              <span className="text-sm font-mono text-gray-500 uppercase">{qrData.colors.textColor}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto Superior (Opcional)
            </label>
            <input
              type="text"
              maxLength={40}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Ex: Escaneie o código"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto Inferior (Opcional)
            </label>
            <input
              type="text"
              maxLength={40}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Ex: Para acessar o site"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
            />
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo Customizado (Opcional)
        </label>
        
        {customLogo ? (
          <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <img src={customLogo} alt="Logo" className="w-12 h-12 object-contain bg-white border border-gray-200 p-1 rounded" />
            <button
              onClick={() => setCustomLogo(null)}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm ml-auto"
              type="button"
            >
              <X size={16} /> Remover Logo
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
              <ImageIcon className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">Clique para fazer upload do logo</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG ou SVG</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleLogoUpload}
            />
          </label>
        )}
      </div>
    </div>
  );
}

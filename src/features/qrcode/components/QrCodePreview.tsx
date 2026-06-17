import React, { useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';

interface QrCodePreviewProps {
  finalQrCodeString: string;
  customLogo: string | null;
  topText: string;
  bottomText: string;
  colors: {
    useGradient: boolean;
    gradientType: 'instagram' | 'facebook' | 'whatsapp' | 'none';
    qrColor: string;
    bgColor: string;
    textColor: string;
  };
}

type ExportFormat = 'png' | 'jpg' | 'svg';
type ExportSize = 250 | 500 | 1000 | 2000;

export function QrCodePreview({ finalQrCodeString, customLogo, topText, bottomText, colors }: QrCodePreviewProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [size, setSize] = useState<ExportSize>(500);

  const triggerDownload = (url: string, filename: string) => {
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const downloadQRCode = () => {
    const fontSize = Math.floor(size * 0.08);
    const padding = Math.floor(size * 0.05);
    const topTextHeight = topText ? fontSize + padding * 2 : 0;
    const bottomTextHeight = bottomText ? fontSize + padding * 2 : 0;
    const totalHeight = size + topTextHeight + bottomTextHeight;

    const svgElement = document.getElementById('qrcode-svg-export');
    if (!svgElement) return;

    if (format === 'svg') {
      const padding = 20;
      const fontSize = 24;
      const topTextHeight = topText ? fontSize + padding : 0;
      const bottomTextHeight = bottomText ? fontSize + padding : 0;
      const totalHeight = size + topTextHeight + bottomTextHeight + (padding * 2);
      
      const outerSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      outerSvg.setAttribute('width', String(size));
      outerSvg.setAttribute('height', String(totalHeight));
      outerSvg.setAttribute('viewBox', `0 0 ${size} ${totalHeight}`);
      outerSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('width', '100%');
      bgRect.setAttribute('height', '100%');
      bgRect.setAttribute('fill', colors.bgColor);
      outerSvg.appendChild(bgRect);

      const qrGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      qrGroup.setAttribute('transform', `translate(0, ${topTextHeight > 0 ? topTextHeight + padding : padding})`);
      
      if (colors.useGradient) {
        const defs = document.querySelector('#global-qr-gradients');
        if (defs) {
          outerSvg.appendChild(defs.cloneNode(true));
        }
      }

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const innerSvg = new DOMParser().parseFromString(svgData, 'image/svg+xml').documentElement;
      
      innerSvg.removeAttribute('width');
      innerSvg.removeAttribute('height');
      innerSvg.setAttribute('width', String(size));
      innerSvg.setAttribute('height', String(size));
      
      qrGroup.appendChild(innerSvg);
      outerSvg.appendChild(qrGroup);

      if (topText) {
        const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.setAttribute('x', '50%');
        textEl.setAttribute('y', String(padding + fontSize * 0.8)); 
        textEl.setAttribute('text-anchor', 'middle');
        textEl.setAttribute('font-family', 'sans-serif');
        textEl.setAttribute('font-weight', 'bold');
        textEl.setAttribute('font-size', String(fontSize));
        textEl.setAttribute('fill', colors.textColor);
        textEl.textContent = topText;
        outerSvg.appendChild(textEl);
      }
      
      if (bottomText) {
        const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.setAttribute('x', '50%');
        textEl.setAttribute('y', String(topTextHeight + size + padding + fontSize * 0.8)); 
        textEl.setAttribute('text-anchor', 'middle');
        textEl.setAttribute('font-family', 'sans-serif');
        textEl.setAttribute('font-weight', 'bold');
        textEl.setAttribute('font-size', String(fontSize));
        textEl.setAttribute('fill', colors.textColor);
        textEl.textContent = bottomText;
        outerSvg.appendChild(textEl);
      }

      const finalSvgData = new XMLSerializer().serializeToString(outerSvg);
      const blob = new Blob([finalSvgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode.svg`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const padding = 20;
      const fontSize = 24;
      const topTextHeight = topText ? fontSize + padding : 0;
      
      const newCanvas = document.createElement('canvas');
      newCanvas.width = size;
      newCanvas.height = size + topTextHeight + (bottomText ? fontSize + padding : 0) + (padding * 2);
      
      const ctx = newCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = colors.bgColor;
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        
        if (topText) {
          ctx.fillStyle = colors.textColor;
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(topText, newCanvas.width / 2, padding);
        }
        
        if (bottomText) {
          ctx.fillStyle = colors.textColor;
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(bottomText, newCanvas.width / 2, topTextHeight + size + padding + padding);
        }

        let svgData = new XMLSerializer().serializeToString(svgElement);
        if (colors.useGradient) {
           const defs = document.querySelector('#global-qr-gradients')?.outerHTML || '';
           svgData = svgData.replace('>', `>${defs}`);
        }

        const svg64 = btoa(unescape(encodeURIComponent(svgData)));
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, topTextHeight > 0 ? topTextHeight + padding : padding, size, size);
          const url = newCanvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png');
          const link = document.createElement('a');
          link.href = url;
          link.download = `qrcode.${format}`;
          link.click();
        };
        img.src = "data:image/svg+xml;base64," + svg64;
      }
    }
  };

  const currentFgColor = colors.useGradient ? `url(#grad-${colors.gradientType})` : colors.qrColor;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs id="global-qr-gradients">
          <linearGradient id="grad-instagram" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
          <linearGradient id="grad-facebook" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00c6ff" />
            <stop offset="100%" stopColor="#0072ff" />
          </linearGradient>
          <linearGradient id="grad-whatsapp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#128C7E" />
            <stop offset="100%" stopColor="#25D366" />
          </linearGradient>
        </defs>
      </svg>

      <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">Pré-visualização</h3>

      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg mb-6 min-h-[350px]">
        {finalQrCodeString ? (
          <>
            <div className="bg-white p-4 shadow-sm rounded-lg border border-gray-100" style={{ backgroundColor: colors.bgColor }}>
              <div className="flex flex-col items-center">
                {topText && (
                  <div className="mb-2 text-center font-bold break-words max-w-[250px]" style={{ fontSize: '1.2rem', color: colors.textColor }}>{topText}</div>
                )}
                <QRCodeSVG 
                  value={finalQrCodeString} 
                  size={250} 
                  level="H"
                  includeMargin={true}
                  fgColor={currentFgColor}
                  bgColor={colors.bgColor}
                  imageSettings={customLogo ? { src: customLogo, height: 60, width: 60, excavate: true } : undefined}
                />
                {bottomText && (
                  <div className="mt-2 text-center font-bold break-words max-w-[250px]" style={{ fontSize: '1.2rem', color: colors.textColor }}>{bottomText}</div>
                )}
              </div>
            </div>

            <div className="hidden">
              <QRCodeSVG
                id="qrcode-svg-export"
                value={finalQrCodeString}
                size={size}
                level="H"
                includeMargin={true}
                fgColor={currentFgColor}
                bgColor={colors.bgColor}
                imageSettings={customLogo ? { src: customLogo, height: size * 0.2, width: size * 0.2, excavate: true } : undefined}
              />
            </div>
          </>
        ) : (
          <div className="text-gray-400 text-center flex flex-col items-center">
            <span className="block mb-2 text-4xl">📱</span>
            Preencha os dados ao lado<br/>para gerar o QR Code
          </div>
        )}
      </div>

      <div className="w-full max-w-[300px] mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
          <select 
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-sm"
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
          >
            <option value="png">PNG (Ideal para web)</option>
            <option value="jpg">JPG (Fundo opaco)</option>
            <option value="svg">SVG (Vetor infinito)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho da Imagem</label>
          <select 
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-sm"
            value={size}
            onChange={(e) => setSize(Number(e.target.value) as ExportSize)}
          >
            <option value={250}>Pequeno (250x250px)</option>
            <option value={500}>Médio (500x500px)</option>
            <option value={1000}>Grande (1000x1000px)</option>
            <option value={2000}>Máxima Qualidade (2000x2000px)</option>
          </select>
        </div>
      </div>

      <button
        onClick={downloadQRCode}
        disabled={!finalQrCodeString}
        className={`w-full max-w-[300px] flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold shadow-md transition-all ${
          finalQrCodeString 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
        }`}
      >
        <Download size={20} />
        Baixar QR Code
      </button>
    </div>
  );
}

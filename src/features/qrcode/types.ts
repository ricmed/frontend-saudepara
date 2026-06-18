export type QrCodeType = 'url' | 'text' | 'wifi' | 'instagram' | 'facebook' | 'whatsapp';

export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

export interface QrCodeData {
  url: string;
  text: string;
  wifi: {
    ssid: string;
    password?: string;
    encryption: WifiEncryption;
    hidden: boolean;
  };
  instagram: {
    username: string;
  };
  facebook: {
    urlOrUsername: string;
  };
  whatsapp: {
    phone: string;
    message?: string;
  };
  colors: {
    useGradient: boolean;
    gradientType: 'instagram' | 'facebook' | 'whatsapp' | 'none';
    qrColor: string;
    bgColor: string;
    textColor: string;
  };
  logoOptions?: {
    src: string;
    height: number;
    width: number;
    excavate: boolean;
  };
}

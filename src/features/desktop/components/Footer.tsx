import React from "react";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslations";
import { Language } from "@/i18n/types";

interface FooterProps {
  selectedLanguage?: Language;
}

const Footer: React.FC<FooterProps> = ({ selectedLanguage }) => {
  const { t } = useTranslation(selectedLanguage || "pt-BR");
  const currentYear = new Date().getFullYear().toString();

  return (
    <footer className="bg-blue-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-medium mb-4">{t("footer.contact")}</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2 text-pink-500">📍</span>
                <span>{t("footer.address")}</span>
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
              <a
                href="https://www.facebook.com/sespaPARA"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-[#3B5998] flex items-center justify-center hover:opacity-90 transition"
              >
                <Facebook className="h-5 w-5 text-white" />
              </a>
              <a
                href="https://www.instagram.com/sespapara"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-[#C13584] flex items-center justify-center hover:opacity-90 transition"
              >
                <Instagram className="h-5 w-5 text-white" />
              </a>
              <a
                href="https://x.com/SespaPara"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-black flex items-center justify-center hover:opacity-90 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-white"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/sespapara"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-[#FF0000] flex items-center justify-center hover:opacity-90 transition"
              >
                <Youtube className="h-5 w-5 text-white" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">
              {t("footer.openingHours")}
            </h3>
            <p>{t("footer.weekdayHours")}</p>
            <p className="mt-4">{t("footer.sespaBrief")}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">
              {t("footer.ombudsman")}
            </h3>
            <p>{t("footer.feedbackQuestion")}</p>
            <p className="mt-2">{t("footer.contactOmbudsman")}</p>
            <p className="mt-2">📞 0800-280-9209</p>
            <p className="mt-2">✉️ ouvidoria@saude.pa.gov.br</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">
              {t("footer.portalTitle")}
            </h3>
            <p>{t("footer.portalDescription")}</p>
            <p className="mt-2">{t("footer.developedBy")}</p>
          </div>
        </div>
        <div className="text-center text-sm border-t border-white/20 pt-6">
          <p>{t("footer.copyright", { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

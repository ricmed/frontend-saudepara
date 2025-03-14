// Exemplo de um hook que encapsula a lógica de falar as instruções
// e traduzir para o idioma selecionado.

// src/hooks/useVoiceDirections.ts
import { useState, useCallback } from 'react';
import { useGoogleTranslate } from './useGoogleTranslate';
import { SupportedLanguage } from '../types';

export function useVoiceDirections(selectedLanguage: SupportedLanguage) {
  // Controla qual passo atual estamos falando
  const [stepIndex, setStepIndex] = useState(0);

  // Hook que chama a Google Translate API para traduzir as instruções
  const { translateInstructions } = useGoogleTranslate(selectedLanguage);

  // Função que fala as instruções do DirectionsResult
  const speakDirections = useCallback(
    async (directions: google.maps.DirectionsResult) => {
      if (!window.speechSynthesis) {
        alert('Seu navegador não suporta síntese de fala.');
        return;
      }

      // Pegamos os passos (instruções) da primeira rota/leg
      const steps = directions.routes[0].legs[0].steps;

      // Se ainda há steps para falar...
      if (stepIndex < steps.length) {
        // 1) Extraímos a instrução e removemos tags HTML
        let instructions = steps[stepIndex].instructions.replace(/<[^>]*>/g, '');

        // 2) Traduzimos a instrução se selectedLanguage != 'pt-BR'
        const translatedText = await translateInstructions(instructions);

        // 3) Criamos o utterance com o texto (traduzido ou original)
        const utterance = new SpeechSynthesisUtterance(translatedText);
        utterance.lang = selectedLanguage; // ex: 'en-US', 'es-ES', 'fr-FR', etc.

        // Opcionalmente, podemos ajustar rate para certos idiomas
        if (selectedLanguage === 'zh-CN') {
          utterance.rate = 0.9;
        }

        // Quando a fala dessa instrução terminar, avançamos pro próximo passo
        utterance.onend = () => {
          setStepIndex((prev) => prev + 1);
        };

        // 4) Falar a instrução
        window.speechSynthesis.speak(utterance);
      }
    },
    [stepIndex, selectedLanguage, translateInstructions]
  );

  // Função de reset: caso queira voltar para a primeira instrução
  const resetSteps = useCallback(() => {
    setStepIndex(0);
    window.speechSynthesis.cancel();
  }, []);

  return { speakDirections, stepIndex, resetSteps };
}

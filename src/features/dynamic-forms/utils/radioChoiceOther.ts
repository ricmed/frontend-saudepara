/** Valor interno quando a opção “com texto livre” está selecionada (evite usar nas opções manuais). */
export const DF_CHOICE_WITH_TEXT_DEFAULT_VALUE = '__df_choice_with_text__';

/** Chave auxiliar em `formData` para o texto da opção com resposta livre (lodash path). Usada em `radio`, `select` em cartões e `checkbox-group`. */
export function radioChoiceOtherTextKey(fieldKey: string): string {
  // Importante: não pode ficar "dentro" do próprio fieldKey (ex.: `${fieldKey}.__df_other_text`),
  // porque isso conflita quando o valor principal é string/array e pode quebrar seleção visual.
  // Guardamos em namespace separado e com segment seguro (sem pontos/brackets).
  const safeSegment = encodeURIComponent(String(fieldKey ?? '').trim()).replace(/\./g, '%2E');
  return `__df_other_text.${safeSegment}`;
}

/** Valor interno quando a opção “com texto livre” está selecionada (evite usar nas opções manuais). */
export const DF_CHOICE_WITH_TEXT_DEFAULT_VALUE = '__df_choice_with_text__';

/** Chave auxiliar em `formData` para o texto da opção com resposta livre (lodash path). */
export function radioChoiceOtherTextKey(fieldKey: string): string {
  return `${fieldKey}.__df_other_text`;
}

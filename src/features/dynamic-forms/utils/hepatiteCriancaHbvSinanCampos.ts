/**
 * Números oficiais da ficha SINAN — Criança exposta ao HBV (SES-PA / MS).
 * Fonte: instrumento impresso (`Sistema Hepatite/_pdf_all.txt`) e seed `seedHepatiteCriancaHBV.ts`.
 * Manter em sincronia com `backend-saudepara/src/scripts/hepatiteCriancaHbvSinanCampos.ts`.
 */
export const HEPATITE_CRIANCA_HBV_SINAN_CAMPO_BY_KEY: Readonly<Record<string, string>> = {
  // 1–7 Dados gerais
  'notificacao.tipo_notificacao': '1',
  'notificacao.agravo_doenca': '2',
  agravo_cid: '3',
  'notificacao.dt_notificacao': '4',
  'notificacao.uf_notificacao': '5',
  'notificacao.municipio_notificacao_ibge': '6',
  'notificacao.estabelecimento_cnes': '6',
  'clinica.data_inicio_sintomas': '7',

  // 8–15 Notificação individual
  'paciente.nome': '8',
  'paciente.data_nascimento': '9',
  'paciente.idade': '10',
  'paciente.sexo': '11',
  'paciente.raca_cor': '12',
  'paciente.nome_mae': '13',
  'crianca_hbv.numero_sinan_mae': '14',
  'paciente.cns': '15',

  // 16–29 Residência
  'residencia.uf': '16',
  'residencia.municipio_ibge': '18',
  'residencia.bairro': '19',
  'residencia.logradouro': '20',
  'residencia.numero': '21',
  'residencia.complemento': '22',
  'residencia.geo_campo_1': '23',
  'residencia.geo_campo_2': '24',
  'residencia.ponto_referencia': '25',
  'residencia.cep': '26',
  'residencia.telefone': '27',
  'residencia.zona': '28',
  'residencia.pais': '29',

  // 30–36 Mãe / antecedentes
  'mae.idade': '30',
  'mae.escolaridade': '31',
  'mae.raca_cor': '32',
  'mae.ocupacao_cbo': '33',
  'mae.hiv_aids': '34',
  'mae.imunizacao_hepatite_b_completa': '35',
  'mae.imunizacao_hepatite_b_incompleta': '35',
  'mae.imunizacao_hepatite_a_completa': '35',
  'mae.imunizacao_hepatite_a_incompleta': '35',
  'mae.confirmacao_carteira': '35',
  'mae.sifilis': '36',
  'mae.outras_dst': '36',
  'mae.outras_dst_quais': '36',

  // 37–40 Laboratório da mãe
  'mae.lab.sorologia_reagente_hepatite_b': '37',
  'mae.lab.sorologia_reagente_hepatite_c': '37',
  'mae.lab.hepatite_b_quando_antes_prenatal': '38',
  'mae.lab.hepatite_b_quando_durante_prenatal': '38',
  'mae.lab.hepatite_b_quando_maternidade': '38',
  'mae.lab.hepatite_c_quando_antes_prenatal': '38',
  'mae.lab.hepatite_c_quando_durante_prenatal': '38',
  'mae.lab.hepatite_c_quando_maternidade': '38',
  'mae.lab.hbv_hbsag': '39',
  'mae.lab.hbv_anti_hbc_total': '39',
  'mae.lab.hbv_anti_hbc_igm': '39',
  'mae.lab.hbv_hbeag': '39',
  'mae.lab.hbv_anti_hbe': '39',
  'mae.lab.hbv_anti_hbs': '39',
  'mae.lab.hbv_dna': '39',
  'mae.lab.hcv_anti_hcv': '40',
  'mae.lab.hcv_rna': '40',

  // 41–49 Pré-natal
  'prenatal.fez_prenatal': '41',
  'prenatal.uf': '42',
  'prenatal.municipio_ibge': '43',
  'prenatal.estabelecimento_cnes': '44',
  'prenatal.endereco': '45',
  'prenatal.telefone': '46',
  'prenatal.tratamento_hepatite_b': '47',
  'prenatal.prevencao_transmissao_vertical_b': '47',
  'prenatal.medicamento_utilizado': '48',
  'prenatal.familia_portadora_hepatite_b': '49',
  'prenatal.familia_portadora_hepatite_c': '49',

  // 50–54 Nascimento
  'crianca.numero_dnv': '50',
  'crianca.nascimento_uf': '51',
  'crianca.nascimento_municipio_ibge': '52',
  'crianca.hospital_nascimento_cnes': '53',
  'crianca.vacina_hepatite_b_maternidade': '54',
  'crianca.imunoglobulina_hbig': '54',
  'crianca.imunoglobulina_hbig_data': '54',
  'crianca.vacina_hepatite_a': '54',

  // 55–57 Vacina HBV (acompanhamento)
  'crianca.vacina_hepatite_b_dose_1': '55',
  'crianca.vacina_hepatite_b_dose_1_data': '55',
  'crianca.vacina_hepatite_b_dose_2': '56',
  'crianca.vacina_hepatite_b_dose_2_data': '56',
  'crianca.vacina_hepatite_b_dose_3': '57',
  'crianca.vacina_hepatite_b_dose_3_data': '57',
  'crianca.vacina_hepatite_b_dose_4': '57',
  'crianca.vacina_hepatite_b_dose_4_data': '57',

  // 58 / 58.1 Laboratório da criança (pós-vacinação)
  'crianca.lab.esquema1.hbsag': '58',
  'crianca.lab.esquema1.hbsag_data': '58',
  'crianca.lab.esquema1.anti_hbs': '58',
  'crianca.lab.esquema1.anti_hbs_data': '58',
  'crianca.lab.esquema1.hbv_dna': '58',
  'crianca.lab.esquema1.hbv_dna_quantificacao': '58',
  'crianca.lab.esquema1.hbv_dna_data': '58',
  'crianca.lab.esquema1.alt': '58',
  'crianca.lab.esquema1.alt_data': '58',
  'crianca.lab.registrar_esquema_2': '58',
  'crianca.lab.esquema2.hbsag': '58.1',
  'crianca.lab.esquema2.hbsag_data': '58.1',
  'crianca.lab.esquema2.anti_hbs': '58.1',
  'crianca.lab.esquema2.anti_hbs_data': '58.1',
  'crianca.lab.esquema2.hbv_dna': '58.1',
  'crianca.lab.esquema2.hbv_dna_quantificacao': '58.1',
  'crianca.lab.esquema2.hbv_dna_data': '58.1',
  'crianca.lab.esquema2.alt': '58.1',
  'crianca.lab.esquema2.alt_data': '58.1',

  // 59 Acompanhamento (HCV — 18 meses)
  'crianca.acomp.anti_hcv': '59',
  'crianca.acomp.anti_hcv_data': '59',
  'crianca.acomp.hcv_rna': '59',
  'crianca.acomp.hcv_rna_quantificacao': '59',
  'crianca.acomp.hcv_rna_data': '59',

  // 60–62 Conclusão
  'conclusao.evolucao_caso': '60',
  'conclusao.classificacao_etiologica': '61',
  'conclusao.data_encerramento': '62',
  'conclusao.observacoes_adicionais': '62',
};

export function resolveHepatiteCriancaHbvSinanCampo(
  field: { key: string; sinanCampo?: string },
): string | undefined {
  const fromSchema = field.sinanCampo?.trim();
  if (fromSchema) return fromSchema;
  return HEPATITE_CRIANCA_HBV_SINAN_CAMPO_BY_KEY[field.key];
}

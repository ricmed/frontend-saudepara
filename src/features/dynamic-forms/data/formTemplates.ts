import type { FormSchema } from '@/services/FormService';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'pesquisas_avaliacoes' | 'eventos_inscricoes' | 'ouvidoria_atendimento' | 'capacitacoes_educacao_permanente' | 'gestao_administrativo' | 'saude';
  categoryLabel: string;
  schema: FormSchema;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

let _fieldCounter = 0;
const fid = () => `f${++_fieldCounter}`;
const sid = () => `s${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─────────────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TEMPLATES: FormTemplate[] = [
  // ── 1. Pesquisa de Satisfação ────────────────────────────────────────────
  {
    id: 'pesquisa-satisfacao',
    name: 'Pesquisa de Satisfação',
    description: 'Avalie a qualidade de um serviço ou atendimento com perguntas de nota e comentários.',
    emoji: '⭐',
    category: 'pesquisas_avaliacoes',
    categoryLabel: 'Pesquisas',
    schema: {
      agravo: 'PESQUISA_SATISFACAO',
      title: 'Pesquisa de Satisfação',
      sections: [
        {
          id: sid(),
          title: 'Avaliação do Atendimento',
          description: 'Conte-nos sobre sua experiência.',
          order: 1,
          fields: [
            {
              key: 'servico_utilizado',
              label: 'Qual serviço foi utilizado?',
              type: 'select',
              required: true,
              order: 1,
              options: [
                { value: 'consulta', label: 'Consulta médica' },
                { value: 'exame', label: 'Realização de exame' },
                { value: 'vacinacao', label: 'Vacinação' },
                { value: 'internacao', label: 'Internação' },
                { value: 'urgencia', label: 'Urgência / Emergência' },
                { value: 'outro', label: 'Outro' },
              ],
            },
            {
              key: 'nota_geral',
              label: 'Como você avalia o atendimento de forma geral?',
              type: 'rating',
              required: true,
              order: 2,
              min: 1,
              max: 5,
            },
            {
              key: 'recomendaria',
              label: 'Você recomendaria este serviço a um familiar ou amigo?',
              type: 'linear_scale',
              required: true,
              order: 3,
              min: 0,
              max: 10,
              scaleLowLabel: 'Não recomendaria',
              scaleHighLabel: 'Recomendaria com certeza',
            },
            {
              key: 'tempo_espera',
              label: 'Como avalia o tempo de espera?',
              type: 'radio',
              required: true,
              order: 4,
              options: [
                { value: 'otimo', label: 'Ótimo (menos de 15 min)' },
                { value: 'bom', label: 'Bom (15 a 30 min)' },
                { value: 'regular', label: 'Regular (30 a 60 min)' },
                { value: 'ruim', label: 'Ruim (mais de 60 min)' },
              ],
            },
            {
              key: 'sugestoes',
              label: 'O que podemos melhorar? (opcional)',
              type: 'textarea',
              required: false,
              order: 5,
              placeholder: 'Escreva sua sugestão ou comentário...',
              maxLength: 1000,
            },
          ],
        },
        {
          id: sid(),
          title: 'Identificação (opcional)',
          description: 'Seus dados são confidenciais e não são obrigatórios.',
          order: 2,
          fields: [
            {
              key: 'nome_respondente',
              label: 'Nome',
              type: 'text',
              required: false,
              order: 1,
              placeholder: 'Seu nome completo',
            },
            {
              key: 'contato_respondente',
              label: 'Telefone ou e-mail',
              type: 'text',
              required: false,
              order: 2,
              placeholder: '(xx) xxxxx-xxxx ou email@exemplo.com',
            },
          ],
        },
      ],
    },
  },

  // ── 2. Inscrição em Evento ───────────────────────────────────────────────
  {
    id: 'inscricao-evento',
    name: 'Inscrição em Evento',
    description: 'Formulário completo para inscrição em cursos, seminários, eventos e capacitações.',
    emoji: '🎫',
    category: 'eventos_inscricoes',
    categoryLabel: 'Eventos',
    schema: {
      agravo: 'INSCRICAO_EVENTO',
      title: 'Inscrição em Evento',
      sections: [
        {
          id: sid(),
          title: 'Dados Pessoais',
          order: 1,
          fields: [
            { key: 'nome_completo', label: 'Nome completo', type: 'text', required: true, order: 1 },
            { key: 'cpf', label: 'CPF', type: 'cpf', required: true, order: 2 },
            { key: 'data_nascimento', label: 'Data de nascimento', type: 'date', required: true, order: 3 },
            { key: 'email', label: 'E-mail', type: 'email', required: true, order: 4 },
            { key: 'telefone', label: 'Telefone / WhatsApp', type: 'phone', required: true, order: 5 },
            { key: 'municipio', label: 'Município', type: 'text', required: true, order: 6 },
          ],
        },
        {
          id: sid(),
          title: 'Dados Profissionais',
          order: 2,
          fields: [
            { key: 'instituicao', label: 'Instituição / Órgão', type: 'text', required: true, order: 1 },
            { key: 'cargo', label: 'Cargo / Função', type: 'text', required: true, order: 2 },
            {
              key: 'categoria_profissional',
              label: 'Categoria profissional',
              type: 'select',
              required: true,
              order: 3,
              options: [
                { value: 'medico', label: 'Médico(a)' },
                { value: 'enfermeiro', label: 'Enfermeiro(a)' },
                { value: 'tecnico_enfermagem', label: 'Técnico(a) de Enfermagem' },
                { value: 'agente_saude', label: 'Agente Comunitário de Saúde' },
                { value: 'vigilancia', label: 'Vigilância Epidemiológica' },
                { value: 'administrativo', label: 'Administrativo' },
                { value: 'outro', label: 'Outro' },
              ],
            },
          ],
        },
        {
          id: sid(),
          title: 'Inscrição',
          order: 3,
          fields: [
            {
              key: 'turma',
              label: 'Turma / Módulo de interesse',
              type: 'select',
              required: true,
              order: 1,
              options: [
                { value: 'turma_1', label: 'Turma 1 — Manhã' },
                { value: 'turma_2', label: 'Turma 2 — Tarde' },
                { value: 'turma_3', label: 'Turma 3 — Noite' },
              ],
            },
            {
              key: 'necessidade_especial',
              label: 'Possui necessidade de acessibilidade?',
              type: 'checkbox',
              required: false,
              order: 2,
            },
            {
              key: 'descricao_necessidade',
              label: 'Descreva a necessidade (se aplicável)',
              type: 'textarea',
              required: false,
              order: 3,
              maxLength: 500,
            },
            {
              key: 'observacoes',
              label: 'Observações adicionais',
              type: 'textarea',
              required: false,
              order: 4,
              maxLength: 500,
            },
          ],
        },
      ],
    },
  },

  // ── 3. Avaliação de Capacitação ──────────────────────────────────────────
  {
    id: 'avaliacao-capacitacao',
    name: 'Avaliação de Capacitação',
    description: 'Colete feedback sobre cursos, treinamentos e eventos de educação permanente.',
    emoji: '📚',
    category: 'capacitacoes_educacao_permanente',
    categoryLabel: 'Capacitações',
    schema: {
      agravo: 'AVALIACAO_CAPACITACAO',
      title: 'Avaliação de Capacitação',
      sections: [
        {
          id: sid(),
          title: 'Avaliação do Conteúdo',
          order: 1,
          fields: [
            {
              key: 'nome_capacitacao',
              label: 'Nome da capacitação avaliada',
              type: 'text',
              required: true,
              order: 1,
            },
            {
              key: 'nota_conteudo',
              label: 'Qualidade do conteúdo programático',
              type: 'rating',
              required: true,
              order: 2,
              min: 1,
              max: 5,
            },
            {
              key: 'nota_material',
              label: 'Qualidade do material didático',
              type: 'rating',
              required: true,
              order: 3,
              min: 1,
              max: 5,
            },
            {
              key: 'relevancia_pratica',
              label: 'Relevância do conteúdo para sua prática profissional',
              type: 'linear_scale',
              required: true,
              order: 4,
              min: 1,
              max: 5,
              scaleLowLabel: 'Pouco relevante',
              scaleHighLabel: 'Muito relevante',
            },
            {
              key: 'carga_horaria',
              label: 'A carga horária foi adequada?',
              type: 'radio',
              required: true,
              order: 5,
              options: [
                { value: 'insuficiente', label: 'Insuficiente' },
                { value: 'adequada', label: 'Adequada' },
                { value: 'excessiva', label: 'Excessiva' },
              ],
            },
          ],
        },
        {
          id: sid(),
          title: 'Avaliação do(s) Instrutor(es)',
          order: 2,
          fields: [
            {
              key: 'nota_dominio',
              label: 'Domínio do conteúdo pelo instrutor',
              type: 'rating',
              required: true,
              order: 1,
              min: 1,
              max: 5,
            },
            {
              key: 'nota_clareza',
              label: 'Clareza e didática na apresentação',
              type: 'rating',
              required: true,
              order: 2,
              min: 1,
              max: 5,
            },
            {
              key: 'nota_interacao',
              label: 'Interação com os participantes',
              type: 'rating',
              required: true,
              order: 3,
              min: 1,
              max: 5,
            },
          ],
        },
        {
          id: sid(),
          title: 'Sugestões e Comentários',
          order: 3,
          fields: [
            {
              key: 'pontos_positivos',
              label: 'Pontos positivos da capacitação',
              type: 'textarea',
              required: false,
              order: 1,
              maxLength: 800,
            },
            {
              key: 'sugestoes_melhoria',
              label: 'Sugestões de melhoria',
              type: 'textarea',
              required: false,
              order: 2,
              maxLength: 800,
            },
            {
              key: 'temas_interesse',
              label: 'Temas que gostaria de ver em futuras capacitações',
              type: 'textarea',
              required: false,
              order: 3,
              maxLength: 500,
            },
          ],
        },
      ],
    },
  },

  // ── 4. Ouvidoria / Manifestação ──────────────────────────────────────────
  {
    id: 'ouvidoria',
    name: 'Ouvidoria / Manifestação',
    description: 'Receba reclamações, sugestões, elogios, denúncias e solicitações de forma organizada.',
    emoji: '📢',
    category: 'ouvidoria_atendimento',
    categoryLabel: 'Ouvidoria',
    schema: {
      agravo: 'OUVIDORIA',
      title: 'Ouvidoria — Manifestação do Cidadão',
      sections: [
        {
          id: sid(),
          title: 'Tipo de Manifestação',
          order: 1,
          fields: [
            {
              key: 'tipo_manifestacao',
              label: 'Tipo de manifestação',
              type: 'radio',
              required: true,
              order: 1,
              options: [
                { value: 'reclamacao', label: '😠 Reclamação' },
                { value: 'sugestao', label: '💡 Sugestão' },
                { value: 'elogio', label: '👏 Elogio' },
                { value: 'solicitacao', label: '📋 Solicitação de informação' },
                { value: 'denuncia', label: '🚨 Denúncia' },
              ],
            },
            {
              key: 'setor_envolvido',
              label: 'Setor / Serviço envolvido',
              type: 'select',
              required: true,
              order: 2,
              options: [
                { value: 'recepcao', label: 'Recepção / Triagem' },
                { value: 'consultorio', label: 'Consultório médico' },
                { value: 'enfermagem', label: 'Enfermagem' },
                { value: 'farmacia', label: 'Farmácia' },
                { value: 'laboratorio', label: 'Laboratório' },
                { value: 'administrativo', label: 'Setor administrativo' },
                { value: 'outro', label: 'Outro' },
              ],
            },
            {
              key: 'data_ocorrido',
              label: 'Data em que ocorreu (ou período)',
              type: 'date',
              required: false,
              order: 3,
            },
          ],
        },
        {
          id: sid(),
          title: 'Descrição',
          order: 2,
          fields: [
            {
              key: 'descricao',
              label: 'Descreva detalhadamente sua manifestação',
              type: 'textarea',
              required: true,
              order: 1,
              placeholder: 'Relate o que aconteceu, onde, com quem e como...',
              maxLength: 2000,
            },
            {
              key: 'documentos',
              label: 'Anexar documentos (opcional)',
              type: 'file',
              required: false,
              order: 2,
            },
          ],
        },
        {
          id: sid(),
          title: 'Identificação (opcional)',
          description: 'O anonimato é garantido. Informe seu contato somente se desejar retorno.',
          order: 3,
          fields: [
            {
              key: 'nome_manifestante',
              label: 'Nome completo',
              type: 'text',
              required: false,
              order: 1,
            },
            {
              key: 'cpf_manifestante',
              label: 'CPF',
              type: 'cpf',
              required: false,
              order: 2,
            },
            {
              key: 'email_manifestante',
              label: 'E-mail para retorno',
              type: 'email',
              required: false,
              order: 3,
            },
            {
              key: 'telefone_manifestante',
              label: 'Telefone para contato',
              type: 'phone',
              required: false,
              order: 4,
            },
            {
              key: 'deseja_anonimato',
              label: 'Desejo manter anonimato',
              type: 'checkbox',
              required: false,
              order: 5,
            },
          ],
        },
      ],
    },
  },

  // ── 5. Cadastro de Participante ──────────────────────────────────────────
  {
    id: 'cadastro-participante',
    name: 'Cadastro de Participante',
    description: 'Formulário completo de cadastro com dados pessoais, endereço e contato.',
    emoji: '👤',
    category: 'gestao_administrativo',
    categoryLabel: 'Administrativo',
    schema: {
      agravo: 'CADASTRO_PARTICIPANTE',
      title: 'Cadastro de Participante',
      sections: [
        {
          id: sid(),
          title: 'Dados Pessoais',
          order: 1,
          fields: [
            { key: 'nome_completo', label: 'Nome completo', type: 'text', required: true, order: 1 },
            { key: 'data_nascimento', label: 'Data de nascimento', type: 'date', required: true, order: 2 },
            {
              key: 'sexo',
              label: 'Sexo',
              type: 'radio',
              required: true,
              order: 3,
              options: [
                { value: 'M', label: 'Masculino' },
                { value: 'F', label: 'Feminino' },
                { value: 'I', label: 'Ignorado' },
              ],
            },
            { key: 'cpf', label: 'CPF', type: 'cpf', required: true, order: 4 },
            { key: 'cns', label: 'Cartão SUS (CNS)', type: 'cns', required: false, order: 5 },
          ],
        },
        {
          id: sid(),
          title: 'Contato',
          order: 2,
          fields: [
            { key: 'email', label: 'E-mail', type: 'email', required: false, order: 1 },
            { key: 'telefone', label: 'Telefone / WhatsApp', type: 'phone', required: true, order: 2 },
            { key: 'telefone_alternativo', label: 'Telefone alternativo', type: 'phone', required: false, order: 3 },
          ],
        },
        {
          id: sid(),
          title: 'Endereço',
          order: 3,
          fields: [
            { key: 'cep', label: 'CEP', type: 'cep', required: false, order: 1 },
            { key: 'logradouro', label: 'Logradouro', type: 'text', required: false, order: 2 },
            { key: 'numero', label: 'Número', type: 'text', required: false, order: 3 },
            { key: 'complemento', label: 'Complemento', type: 'text', required: false, order: 4 },
            { key: 'bairro', label: 'Bairro', type: 'text', required: false, order: 5 },
            { key: 'municipio', label: 'Município', type: 'text', required: true, order: 6 },
          ],
        },
      ],
    },
  },

  // ── 6. Inquérito Epidemiológico Básico ───────────────────────────────────
  {
    id: 'inquerito-epidemiologico',
    name: 'Inquérito Epidemiológico',
    description: 'Estrutura básica para investigação de casos: identificação, clínica e exposição.',
    emoji: '🦠',
    category: 'saude',
    categoryLabel: 'Saúde',
    schema: {
      agravo: 'INQUERITO_EPIDEMIOLOGICO',
      title: 'Inquérito Epidemiológico',
      sections: [
        {
          id: sid(),
          title: 'Identificação do Caso',
          order: 1,
          fields: [
            { key: 'nome_paciente', label: 'Nome do paciente', type: 'text', required: true, order: 1 },
            { key: 'data_nascimento', label: 'Data de nascimento', type: 'date', required: true, order: 2 },
            {
              key: 'sexo',
              label: 'Sexo',
              type: 'radio',
              required: true,
              order: 3,
              options: [
                { value: 'M', label: 'Masculino' },
                { value: 'F', label: 'Feminino' },
                { value: 'I', label: 'Ignorado' },
              ],
            },
            { key: 'cpf_paciente', label: 'CPF', type: 'cpf', required: false, order: 4 },
            { key: 'cns_paciente', label: 'Cartão SUS (CNS)', type: 'cns', required: false, order: 5 },
            { key: 'municipio_residencia', label: 'Município de residência', type: 'text', required: true, order: 6 },
            { key: 'telefone_paciente', label: 'Telefone para contato', type: 'phone', required: false, order: 7 },
          ],
        },
        {
          id: sid(),
          title: 'Dados Clínico-Epidemiológicos',
          order: 2,
          fields: [
            { key: 'data_inicio_sintomas', label: 'Data de início dos sintomas', type: 'date', required: true, order: 1 },
            { key: 'data_atendimento', label: 'Data do atendimento', type: 'date', required: true, order: 2 },
            {
              key: 'sintomas',
              label: 'Sintomas apresentados',
              type: 'checkbox-group',
              required: true,
              order: 3,
              options: [
                { value: 'febre', label: 'Febre' },
                { value: 'tosse', label: 'Tosse' },
                { value: 'cefaleia', label: 'Cefaleia' },
                { value: 'mialgia', label: 'Mialgia / Dores no corpo' },
                { value: 'vomito', label: 'Vômito / Náusea' },
                { value: 'diarreia', label: 'Diarreia' },
                { value: 'exantema', label: 'Exantema (manchas na pele)' },
                { value: 'dispneia', label: 'Dificuldade respiratória' },
              ],
            },
            {
              key: 'hospitalizado',
              label: 'Paciente foi hospitalizado?',
              type: 'radio',
              required: true,
              order: 4,
              options: [
                { value: '1', label: 'Sim' },
                { value: '2', label: 'Não' },
                { value: '9', label: 'Ignorado' },
              ],
            },
            { key: 'data_internacao', label: 'Data de internação (se aplicável)', type: 'date', required: false, order: 5 },
            {
              key: 'classificacao_final',
              label: 'Classificação final do caso',
              type: 'select',
              required: false,
              order: 6,
              options: [
                { value: '1', label: 'Confirmado' },
                { value: '2', label: 'Descartado' },
                { value: '3', label: 'Inconclusivo' },
                { value: '8', label: 'Em investigação' },
              ],
            },
          ],
        },
        {
          id: sid(),
          title: 'Exposição e Informações Adicionais',
          order: 3,
          fields: [
            {
              key: 'local_provavel_infeccao',
              label: 'Local provável de infecção',
              type: 'text',
              required: false,
              order: 1,
              placeholder: 'Município / local',
            },
            {
              key: 'observacoes_clinicas',
              label: 'Observações clínicas / epidemiológicas',
              type: 'textarea',
              required: false,
              order: 2,
              maxLength: 1500,
            },
          ],
        },
      ],
    },
  },

  // ── 7. Avaliação de Serviço de Saúde ─────────────────────────────────────
  {
    id: 'avaliacao-servico-saude',
    name: 'Avaliação de Serviço de Saúde',
    description: 'Meça a satisfação do usuário com unidades de saúde: UBS, UPA, hospital e outros.',
    emoji: '🏥',
    category: 'pesquisas_avaliacoes',
    categoryLabel: 'Pesquisas',
    schema: {
      agravo: 'AVALIACAO_SERVICO_SAUDE',
      title: 'Avaliação do Serviço de Saúde',
      sections: [
        {
          id: sid(),
          title: 'Identificação da Visita',
          order: 1,
          fields: [
            {
              key: 'tipo_unidade',
              label: 'Tipo de unidade visitada',
              type: 'select',
              required: true,
              order: 1,
              options: [
                { value: 'ubs', label: 'UBS (Unidade Básica de Saúde)' },
                { value: 'upa', label: 'UPA (Unidade de Pronto Atendimento)' },
                { value: 'hospital', label: 'Hospital' },
                { value: 'ceo', label: 'CEO (Odontologia)' },
                { value: 'caps', label: 'CAPS (Saúde Mental)' },
                { value: 'outro', label: 'Outro' },
              ],
            },
            { key: 'data_visita', label: 'Data da visita', type: 'date', required: true, order: 2, defaultCurrentDate: true },
            {
              key: 'motivo_visita',
              label: 'Motivo da visita',
              type: 'radio',
              required: true,
              order: 3,
              options: [
                { value: 'consulta', label: 'Consulta de rotina' },
                { value: 'urgencia', label: 'Urgência' },
                { value: 'exame', label: 'Realização de exame' },
                { value: 'vacinacao', label: 'Vacinação' },
                { value: 'retirada_medicamento', label: 'Retirada de medicamento' },
                { value: 'outro', label: 'Outro' },
              ],
            },
          ],
        },
        {
          id: sid(),
          title: 'Avaliação da Qualidade',
          order: 2,
          fields: [
            { key: 'nota_acolhimento', label: 'Acolhimento e atendimento na recepção', type: 'rating', required: true, order: 1, min: 1, max: 5 },
            { key: 'nota_tempo_espera', label: 'Tempo de espera', type: 'rating', required: true, order: 2, min: 1, max: 5 },
            { key: 'nota_profissional', label: 'Atendimento do profissional de saúde', type: 'rating', required: true, order: 3, min: 1, max: 5 },
            { key: 'nota_instalacoes', label: 'Instalações e limpeza', type: 'rating', required: true, order: 4, min: 1, max: 5 },
            {
              key: 'nota_geral',
              label: 'Nota geral do serviço (0 a 10)',
              type: 'linear_scale',
              required: true,
              order: 5,
              min: 0,
              max: 10,
              scaleLowLabel: 'Péssimo',
              scaleHighLabel: 'Excelente',
            },
          ],
        },
        {
          id: sid(),
          title: 'Comentários',
          order: 3,
          fields: [
            {
              key: 'ponto_positivo',
              label: 'O que mais gostou no atendimento?',
              type: 'textarea',
              required: false,
              order: 1,
              maxLength: 600,
            },
            {
              key: 'ponto_melhoria',
              label: 'O que precisa melhorar?',
              type: 'textarea',
              required: false,
              order: 2,
              maxLength: 600,
            },
          ],
        },
      ],
    },
  },

  // ── 8. Pesquisa de Clima Organizacional ──────────────────────────────────
  {
    id: 'pesquisa-clima',
    name: 'Clima Organizacional',
    description: 'Meça o engajamento e satisfação da equipe com o ambiente de trabalho.',
    emoji: '🌡️',
    category: 'gestao_administrativo',
    categoryLabel: 'Administrativo',
    schema: {
      agravo: 'PESQUISA_CLIMA',
      title: 'Pesquisa de Clima Organizacional',
      sections: [
        {
          id: sid(),
          title: 'Ambiente de Trabalho',
          order: 1,
          fields: [
            { key: 'nota_ambiente', label: 'Como avalia o ambiente físico de trabalho?', type: 'rating', required: true, order: 1, min: 1, max: 5 },
            { key: 'nota_relacionamento', label: 'Relacionamento com colegas de trabalho', type: 'rating', required: true, order: 2, min: 1, max: 5 },
            { key: 'nota_lideranca', label: 'Relacionamento com a liderança imediata', type: 'rating', required: true, order: 3, min: 1, max: 5 },
            {
              key: 'comunicacao',
              label: 'A comunicação interna é eficaz?',
              type: 'radio',
              required: true,
              order: 4,
              options: [
                { value: 'sim', label: 'Sim, sempre' },
                { value: 'quase_sempre', label: 'Quase sempre' },
                { value: 'as_vezes', label: 'Às vezes' },
                { value: 'raramente', label: 'Raramente' },
                { value: 'nao', label: 'Não' },
              ],
            },
          ],
        },
        {
          id: sid(),
          title: 'Satisfação e Engajamento',
          order: 2,
          fields: [
            {
              key: 'satisfacao_geral',
              label: 'Satisfação geral com seu trabalho',
              type: 'linear_scale',
              required: true,
              order: 1,
              min: 1,
              max: 10,
              scaleLowLabel: 'Muito insatisfeito',
              scaleHighLabel: 'Muito satisfeito',
            },
            {
              key: 'permanencia',
              label: 'Pretende continuar na instituição nos próximos 12 meses?',
              type: 'radio',
              required: true,
              order: 2,
              options: [
                { value: 'sim', label: 'Sim' },
                { value: 'nao', label: 'Não' },
                { value: 'talvez', label: 'Talvez' },
              ],
            },
            {
              key: 'reconhecimento',
              label: 'Sente que seu trabalho é reconhecido?',
              type: 'radio',
              required: true,
              order: 3,
              options: [
                { value: 'sempre', label: 'Sim, sempre' },
                { value: 'as_vezes', label: 'Às vezes' },
                { value: 'raramente', label: 'Raramente' },
                { value: 'nao', label: 'Não' },
              ],
            },
          ],
        },
        {
          id: sid(),
          title: 'Sugestões',
          order: 3,
          fields: [
            {
              key: 'sugestoes_melhoria',
              label: 'Sugestões para melhorar o ambiente de trabalho',
              type: 'textarea',
              required: false,
              order: 1,
              maxLength: 1000,
            },
          ],
        },
      ],
    },
  },
];

/** Retorna todos os templates (para o construtor geral). */
export const getAllTemplates = (): FormTemplate[] => FORM_TEMPLATES;

/** Retorna templates por categoria. */
export const getTemplatesByCategory = (category: string): FormTemplate[] =>
  FORM_TEMPLATES.filter((t) => t.category === category);

/** Categorias únicas presentes nos templates. */
export const TEMPLATE_CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'pesquisas_avaliacoes', label: 'Pesquisas' },
  { key: 'eventos_inscricoes', label: 'Eventos' },
  { key: 'ouvidoria_atendimento', label: 'Ouvidoria' },
  { key: 'capacitacoes_educacao_permanente', label: 'Capacitações' },
  { key: 'gestao_administrativo', label: 'Administrativo' },
  { key: 'saude', label: 'Saúde' },
] as const;

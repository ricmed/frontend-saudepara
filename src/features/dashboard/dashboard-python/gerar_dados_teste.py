"""
Script para Gerar Dados de Teste
Sistema de Vigilância em Saúde - Governo do Pará

Execute: python gerar_dados_teste.py
"""

import pandas as pd
from datetime import datetime, timedelta
import random
import numpy as np

def gerar_dados_teste(n_registros=1000):
    """
    Gera dados de teste para o dashboard
    
    Args:
        n_registros: Número de registros a gerar
    """
    print(f"🔄 Gerando {n_registros} registros de teste...")
    
    # Listas de opções
    tipos_atendimento = ['clinico', 'trauma', 'multiplas', 'qbrn']
    generos = [
        'Homem Cisgênero', 'Mulher Cisgênero', 
        'Homem Transgênero', 'Mulher Transgênero',
        'Travesti', 'Não Binário', 'Ignorado', 'Não se Aplica'
    ]
    racas = ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Ignorado']
    publicos = ['Operacional', 'Participante', 'Visitante', 'Não se Aplica']
    estabelecimentos = [
        'Hospital Municipal de Belém',
        'UPA Marambaia',
        'UBS São Brás',
        'Hospital Universitário',
        'Pronto Socorro Municipal',
        'UPA Cabanagem',
        'Hospital Metropolitano',
        'UBS Pedreira'
    ]
    desfechos = ['Alta', 'Internação', 'Transferência', 'Óbito', 'Evasão', 'Em Atendimento']
    hipoteses = [
        'Dengue',
        'Hipertensão',
        'Diabetes',
        'Infarto Agudo do Miocárdio',
        'AVC',
        'Fratura de Membros',
        'Intoxicação Alimentar',
        'COVID-19',
        'Gripe',
        'Gastroenterite'
    ]
    sintomas_lista = [
        'Febre', 'Dor de Cabeça', 'Náusea', 'Vômito', 
        'Dor Abdominal', 'Tosse', 'Falta de Ar', 
        'Dor no Peito', 'Tontura', 'Fraqueza'
    ]
    tipos_trauma = [
        'Queda', 'Acidente de Trânsito', 'Agressão Física',
        'Ferimento por Arma Branca', 'Queimadura', 'Atropelamento'
    ]
    municipios = [
        'Belém', 'Ananindeua', 'Marituba', 'Benevides',
        'Castanhal', 'Santarém', 'Marabá', 'Altamira'
    ]
    bairros_belem = [
        'Umarizal', 'Nazaré', 'Batista Campos', 'Cremação',
        'Pedreira', 'Marco', 'São Brás', 'Marambaia'
    ]
    
    # Gerar dados
    dados = []
    
    for i in range(n_registros):
        # Data de notificação nos últimos 30 dias
        data = datetime.now() - timedelta(
            days=random.randint(0, 30),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )
        
        tipo_atend = random.choice(tipos_atendimento)
        
        registro = {
            'data_notificacao': data,
            'tipo_atendimento': tipo_atend,
            'idade_meses': random.randint(0, 1200),  # 0 a 100 anos
            'genero': random.choice(generos),
            'raca': random.choice(racas),
            'publico': random.choice(publicos),
            'estabelecimento': random.choice(estabelecimentos),
            'desfecho': random.choice(desfechos),
            'hipotese_diagnostica': random.choice(hipoteses),
            'sintomas': ', '.join(random.sample(sintomas_lista, k=random.randint(1, 4))),
            'municipio': random.choice(municipios),
            'bairro': random.choice(bairros_belem),
            'latitude': -1.4558 + random.uniform(-0.1, 0.1),  # Região de Belém
            'longitude': -48.4902 + random.uniform(-0.1, 0.1),
        }
        
        # Adicionar tipo_trauma apenas se for trauma
        if tipo_atend == 'trauma':
            registro['tipo_trauma'] = random.choice(tipos_trauma)
        else:
            registro['tipo_trauma'] = ''
        
        dados.append(registro)
    
    # Criar DataFrame
    df = pd.DataFrame(dados)
    
    # Salvar em CSV
    nome_arquivo = 'dados_teste.csv'
    df.to_csv(nome_arquivo, index=False, encoding='utf-8-sig')
    
    print(f"✅ Dados salvos em: {nome_arquivo}")
    print(f"\n📊 Resumo dos dados gerados:")
    print(f"   • Total de registros: {len(df)}")
    print(f"   • Período: {df['data_notificacao'].min()} a {df['data_notificacao'].max()}")
    print(f"   • Tipos de atendimento:")
    for tipo, count in df['tipo_atendimento'].value_counts().items():
        print(f"      - {tipo}: {count}")
    print(f"\n✅ Pronto para usar no dashboard!")
    print(f"\n🚀 Para executar o dashboard:")
    print(f"   1. Certifique-se que app.py está configurado para ler 'dados_teste.csv'")
    print(f"   2. Execute: python app.py")
    print(f"   3. Acesse: http://localhost:8050")
    
    return df


def gerar_dados_csv_avancado(n_registros=5000):
    """
    Gera dataset mais realista com distribuições ponderadas
    """
    print(f"🔄 Gerando {n_registros} registros avançados...")
    
    dados = []
    
    # Distribuições mais realistas
    for i in range(n_registros):
        # 70% casos clínicos, 20% trauma, 8% múltiplas, 2% qbrn
        tipo_atend = random.choices(
            ['clinico', 'trauma', 'multiplas', 'qbrn'],
            weights=[70, 20, 8, 2]
        )[0]
        
        # Idade mais comum entre 20-60 anos
        idade_meses = int(np.random.normal(40*12, 20*12))
        idade_meses = max(0, min(1200, idade_meses))
        
        # Gênero mais balanceado
        genero = random.choices(
            ['Homem Cisgênero', 'Mulher Cisgênero', 'Homem Transgênero', 
             'Mulher Transgênero', 'Travesti', 'Não Binário', 'Ignorado'],
            weights=[48, 48, 1, 1, 0.5, 0.5, 1]
        )[0]
        
        # Raça baseada em distribuição do Pará
        raca = random.choices(
            ['Parda', 'Branca', 'Preta', 'Indígena', 'Amarela'],
            weights=[70, 15, 10, 4, 1]
        )[0]
        
        # Horário de pico: 8h-18h
        hora = int(np.random.normal(13, 4))
        hora = max(0, min(23, hora))
        
        data = datetime.now() - timedelta(
            days=random.randint(0, 30),
            hours=hora,
            minutes=random.randint(0, 59)
        )
        
        registro = {
            'data_notificacao': data,
            'tipo_atendimento': tipo_atend,
            'idade_meses': idade_meses,
            'genero': genero,
            'raca': raca,
            'publico': random.choices(
                ['Participante', 'Operacional', 'Visitante'],
                weights=[60, 30, 10]
            )[0],
            'estabelecimento': random.choice([
                'Hospital Municipal', 'UPA Central', 'UBS Norte',
                'Pronto Socorro', 'Hospital Regional'
            ]),
            'desfecho': random.choices(
                ['Alta', 'Internação', 'Transferência', 'Óbito'],
                weights=[70, 20, 8, 2]
            )[0],
            'hipotese_diagnostica': random.choice([
                'Dengue', 'Hipertensão', 'Diabetes', 'Gripe',
                'COVID-19', 'Gastroenterite', 'Cefaleia'
            ]),
            'sintomas': ', '.join(random.sample([
                'Febre', 'Dor de Cabeça', 'Náusea', 'Tosse'
            ], k=random.randint(1, 3))),
            'municipio': random.choice(['Belém', 'Ananindeua', 'Marituba']),
            'bairro': random.choice(['Centro', 'Umarizal', 'Marco', 'Pedreira']),
            'latitude': -1.4558 + random.uniform(-0.05, 0.05),
            'longitude': -48.4902 + random.uniform(-0.05, 0.05),
            'tipo_trauma': random.choice(['Queda', 'Acidente']) if tipo_atend == 'trauma' else '',
        }
        
        dados.append(registro)
    
    df = pd.DataFrame(dados)
    nome_arquivo = 'dados_teste_avancado.csv'
    df.to_csv(nome_arquivo, index=False, encoding='utf-8-sig')
    
    print(f"✅ Dataset avançado salvo em: {nome_arquivo}")
    
    return df


if __name__ == '__main__':
    print("=" * 60)
    print("Gerador de Dados de Teste - Dashboard Vigilância em Saúde")
    print("=" * 60)
    
    # Perguntar ao usuário
    print("\nEscolha o tipo de dataset:")
    print("1. Básico (1.000 registros)")
    print("2. Avançado (5.000 registros - mais realista)")
    print("3. Custom (você escolhe)")
    
    escolha = input("\nDigite o número (1-3): ").strip()
    
    if escolha == '1':
        gerar_dados_teste(1000)
    elif escolha == '2':
        gerar_dados_csv_avancado(5000)
    elif escolha == '3':
        try:
            n = int(input("Quantos registros? "))
            gerar_dados_csv_avancado(n)
        except ValueError:
            print("❌ Número inválido. Gerando 1000 registros...")
            gerar_dados_teste(1000)
    else:
        print("❌ Opção inválida. Gerando dataset básico...")
        gerar_dados_teste(1000)
    
    print("\n" + "=" * 60)

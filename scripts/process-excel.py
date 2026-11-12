import pandas as pd
import re
import json
from datetime import date, datetime
from date_utils import compute_expiration_status, extract_expiration_from_text

excel_file = 'Produtos-dbcac7df-7eee-448d-91d9-a0c5f2a05281.xlsx'
df = pd.read_excel(excel_file)
df.columns = ['codigo', 'produto', 'custo', 'valor_venda', 'estoque', 'minimo', 'categoria']

# Encoding cleanup for known issues
category_fixes = {
    'Paramentao e Descartveis': 'Paramentação e Descartáveis',
    'Terapia de Infuso': 'Terapia de Infusão',
    'Dispositivo e Acessorios': 'Dispositivos e Acessórios',
    'Uso Mdico': 'Uso Médico',
    'Estoque em Transio': 'Estoque em Transição',
    'Esterilizao ': 'Esterilização',
    'Esterilizao': 'Esterilização',
    'Descarte de Resduos': 'Descarte de Resíduos',
    'Descartveis Mdicos': 'Descartáveis Médicos',
    'Laminas e Bisturi': 'Lâminas e Bisturi',
    'Algodo': 'Algodão',
}

def clean_category(cat):
    if pd.isna(cat):
        return 'Outros'
    s = str(cat).strip()
    return category_fixes.get(s, s)

def clean_currency(val):
    if pd.isna(val):
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).replace('R$', '').strip().replace('.', '').replace(',', '.')
    try:
        return float(s)
    except:
        return 0.0

def extract_metadata(prod_str):
    p = str(prod_str)
    
    # Validade
    parsed_exp = extract_expiration_from_text(p)
    validade_iso = parsed_exp.iso
    validade_display = parsed_exp.formatted if parsed_exp.valid else None

    # Lote
    lt_match = re.search(r'(?:LT|LOTE)\.?:?\s*([A-Za-z0-9\.\/-]+)', p, re.IGNORECASE)
    lote = lt_match.group(1) if lt_match else None
    if lote:
        lote = lote.strip(' .-:,')

    # Fabricante / Marca (usually between dashes or after certain markers)
    fabricante = None
    parts = [part.strip() for part in p.split(' - ')]
    if len(parts) >= 2:
        candidate = parts[1]
        if not candidate.upper().startswith('LT') and not candidate.upper().startswith('VAL'):
            fabricante = candidate.upper()
    
    # Se ainda vazio, tentar marcas famosas
    if not fabricante:
        for known_brand in ['VITALGOLD', 'ADVANTIVE', 'BIOSANI', 'MEDSONDA', 'SR', 'VITALVEST', 'EQUIPLEX', 'VIC PHARMA', 'FIRSTLAB', 'ERIMAX']:
            if known_brand in p.upper():
                fabricante = known_brand
                break

    # Nome limpo (sem lote e validade no sufixo quando possível)
    nome_limpo = parts[0] if len(parts) > 0 else p
    
    return {
        'nome_limpo': nome_limpo.strip(),
        'fabricante': fabricante or 'NÃO ESPECIFICADO',
        'lote': lote or 'N/I',
        'validade_iso': validade_iso,
        'validade_display': validade_display or 'N/I'
    }

# Process each row
products = []
ref_date = datetime(2026, 11, 3)

for idx, row in df.iterrows():
    codigo = str(row['codigo']).strip()
    prod_raw = str(row['produto']).strip()
    custo = clean_currency(row['custo'])
    venda = clean_currency(row['valor_venda'])
    estoque = int(row['estoque']) if pd.notna(row['estoque']) else 0
    minimo = float(row['minimo']) if pd.notna(row['minimo']) else None
    categoria = clean_category(row['categoria'])
    
    meta = extract_metadata(prod_raw)
    
    # Margem e Lucro
    lucro_unit = round(venda - custo, 2)
    margem_perc = round((lucro_unit / venda * 100), 1) if venda > 0 else 0.0
    markup_perc = round((lucro_unit / custo * 100), 1) if custo > 0 else 0.0
    
    valor_total_custo = round(custo * estoque, 2)
    valor_total_venda = round(venda * estoque, 2)
    lucro_potencial = round(valor_total_venda - valor_total_custo, 2)
    
    # Status de Estoque
    if estoque < 0:
        status_estoque = 'NEGATIVO'
    elif estoque == 0:
        status_estoque = 'ZERADO'
    elif minimo is not None and estoque < minimo:
        status_estoque = 'CRITICO'
    elif minimo is not None and estoque <= minimo * 1.2:
        status_estoque = 'ALERTA'
    else:
        status_estoque = 'NORMAL'
        
    # Sugestão de Reposição
    sugestao_compra_qtd = 0
    sugestao_compra_custo = 0.0
    if minimo is not None and estoque < minimo:
        sugestao_compra_qtd = int(minimo - estoque)
        sugestao_compra_custo = round(sugestao_compra_qtd * custo, 2)
        
    # Status de Validade
    dias_validade, status_validade = compute_expiration_status(
        meta['validade_iso'], ref_date=ref_date.date() if isinstance(ref_date, datetime) else ref_date
    )

    products.append({
        'id': f"prod-{idx+1}",
        'codigo': codigo,
        'produto': prod_raw,
        'nome_resumido': meta['nome_limpo'],
        'fabricante': meta['fabricante'],
        'lote': meta['lote'],
        'validade_iso': meta['validade_iso'],
        'validade': meta['validade_display'],
        'dias_para_vencer': dias_validade,
        'status_validade': status_validade,
        'categoria': categoria,
        'custo': custo,
        'valor_venda': venda,
        'lucro_unitario': lucro_unit,
        'margem_percentual': margem_perc,
        'markup_percentual': markup_perc,
        'estoque': estoque,
        'estoque_minimo': minimo,
        'status_estoque': status_estoque,
        'sugestao_compra_qtd': sugestao_compra_qtd,
        'sugestao_compra_custo': sugestao_compra_custo,
        'valor_total_custo': valor_total_custo,
        'valor_total_venda': valor_total_venda,
        'lucro_potencial': lucro_potencial
    })

# Curva ABC baseada no valor de venda em estoque (ou valor_total_custo)
# Se estoque for <= 0, o valor é zero para fins de curva ABC positiva
products_sorted = sorted(products, key=lambda x: max(0.0, x['valor_total_venda']), reverse=True)
total_venda_positivo = sum(max(0.0, p['valor_total_venda']) for p in products_sorted)

acc_value = 0.0
for p in products_sorted:
    val = max(0.0, p['valor_total_venda'])
    acc_value += val
    pct = (acc_value / total_venda_positivo * 100) if total_venda_positivo > 0 else 100.0
    p['curva_abc_acumulada_pct'] = round(pct, 2)
    if pct <= 80.0:
        p['curva_abc'] = 'A'
    elif pct <= 95.0:
        p['curva_abc'] = 'B'
    else:
        p['curva_abc'] = 'C'

# Reordena por código ou mantém
products = sorted(products_sorted, key=lambda x: x['codigo'])

# Aggregate metrics
total_skus = len(products)
total_unidades = sum(p['estoque'] for p in products)
valor_total_custo = round(sum(p['valor_total_custo'] for p in products), 2)
valor_total_venda = round(sum(p['valor_total_venda'] for p in products), 2)
lucro_potencial_total = round(valor_total_venda - valor_total_custo, 2)
margem_media = round(sum(p['margem_percentual'] for p in products) / total_skus, 2)
markup_medio = round(sum(p['markup_percentual'] for p in products) / total_skus, 2)

total_zerados = sum(1 for p in products if p['status_estoque'] == 'ZERADO')
total_criticos = sum(1 for p in products if p['status_estoque'] == 'CRITICO')
total_negativos = sum(1 for p in products if p['status_estoque'] == 'NEGATIVO')
total_alertas = sum(1 for p in products if p['status_estoque'] in ('ZERADO', 'CRITICO', 'NEGATIVO'))

total_vencidos = sum(1 for p in products if p['status_validade'] == 'VENCIDO')
total_vence_90d = sum(1 for p in products if p['status_validade'] == 'CRITICO_90D')
total_vence_180d = sum(1 for p in products if p['status_validade'] == 'ATENCAO_180D')

total_sugestao_compra_qtd = sum(p['sugestao_compra_qtd'] for p in products)
total_sugestao_compra_custo = round(sum(p['sugestao_compra_custo'] for p in products), 2)

# Categorias aggregations
categories_map = {}
for p in products:
    c = p['categoria']
    if c not in categories_map:
        categories_map[c] = {
            'categoria': c,
            'skus': 0,
            'unidades': 0,
            'valor_custo': 0.0,
            'valor_venda': 0.0,
            'lucro_potencial': 0.0,
            'itens_zerados': 0,
            'itens_criticos': 0
        }
    categories_map[c]['skus'] += 1
    categories_map[c]['unidades'] += p['estoque']
    categories_map[c]['valor_custo'] += p['valor_total_custo']
    categories_map[c]['valor_venda'] += p['valor_total_venda']
    categories_map[c]['lucro_potencial'] += p['lucro_potencial']
    if p['status_estoque'] == 'ZERADO':
        categories_map[c]['itens_zerados'] += 1
    elif p['status_estoque'] == 'CRITICO':
        categories_map[c]['itens_criticos'] += 1

categories_list = sorted(list(categories_map.values()), key=lambda x: x['valor_venda'], reverse=True)
for c in categories_list:
    c['valor_custo'] = round(c['valor_custo'], 2)
    c['valor_venda'] = round(c['valor_venda'], 2)
    c['lucro_potencial'] = round(c['lucro_potencial'], 2)
    c['participacao_venda_pct'] = round((c['valor_venda'] / valor_total_venda * 100), 2) if valor_total_venda > 0 else 0

# Curva ABC stats
abc_summary = {
    'A': {
        'classe': 'A',
        'skus': sum(1 for p in products if p['curva_abc'] == 'A'),
        'valor_venda': round(sum(p['valor_total_venda'] for p in products if p['curva_abc'] == 'A'), 2),
        'descricao': '80% do valor imobilizado (Alta Prioridade de Gestão)'
    },
    'B': {
        'classe': 'B',
        'skus': sum(1 for p in products if p['curva_abc'] == 'B'),
        'valor_venda': round(sum(p['valor_total_venda'] for p in products if p['curva_abc'] == 'B'), 2),
        'descricao': '15% do valor imobilizado (Média Prioridade)'
    },
    'C': {
        'classe': 'C',
        'skus': sum(1 for p in products if p['curva_abc'] == 'C'),
        'valor_venda': round(sum(p['valor_total_venda'] for p in products if p['curva_abc'] == 'C'), 2),
        'descricao': '5% do valor imobilizado (Cauda Longa / Giro Pontual)'
    }
}

summary = {
    'total_skus': total_skus,
    'total_unidades': total_unidades,
    'valor_total_custo': valor_total_custo,
    'valor_total_venda': valor_total_venda,
    'lucro_potencial_total': lucro_potencial_total,
    'margem_media': margem_media,
    'markup_medio': markup_medio,
    'total_zerados': total_zerados,
    'total_criticos': total_criticos,
    'total_negativos': total_negativos,
    'total_alertas': total_alertas,
    'total_vencidos': total_vencidos,
    'total_vence_90d': total_vence_90d,
    'total_vence_180d': total_vence_180d,
    'total_sugestao_compra_qtd': total_sugestao_compra_qtd,
    'total_sugestao_compra_custo': total_sugestao_compra_custo,
    'curva_abc': abc_summary,
    'categorias': categories_list,
    'data_base': '2026-11-03',
    'origem': 'Produtos-dbcac7df-7eee-448d-91d9-a0c5f2a05281.xlsx'
}

full_data = {
    'summary': summary,
    'products': products
}

with open('lib/data/inventoryData.json', 'w', encoding='utf-8') as f:
    json.dump(full_data, f, ensure_ascii=False, indent=2)

print("Dados gerados com sucesso em lib/data/inventoryData.json!")
print(f"Total produtos: {len(products)}")
print(f"Valor Venda: R$ {valor_total_venda:,.2f}")
print(f"Valor Custo: R$ {valor_total_custo:,.2f}")
print(f"Lucro Potencial: R$ {lucro_potencial_total:,.2f}")
print(f"Classes ABC: A={abc_summary['A']['skus']}, B={abc_summary['B']['skus']}, C={abc_summary['C']['skus']}")
print(f"Categorias tratadas: {len(categories_list)}")

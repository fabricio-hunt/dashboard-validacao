"""
Sincronização diária segura entre a API oficial da SmartPOS e lib/data/inventoryData.json.
Lê SMARTPOS_BASE_URL, SMARTPOS_KEY_ID e SMARTPOS_KEY_SECRET exclusivamente via variáveis de ambiente.
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from date_utils import (
    compute_expiration_status,
    extract_expiration_from_text,
    parse_brazilian_expiration_date,
)

DATA_FILE = os.path.join('lib', 'data', 'inventoryData.json')


def load_local_env_if_present() -> None:
    if os.environ.get('SMARTPOS_KEY_ID') and os.environ.get('SMARTPOS_KEY_SECRET'):
        return
    if not os.path.exists('.env.local'):
        return
    with open('.env.local', encoding='utf-8') as f:
        for line in f:
            stripped = line.strip()
            if not stripped or stripped.startswith('#') or '=' not in stripped:
                continue
            k, v = stripped.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())


def extract_metadata(prod_str: str, fallback_supplier: str = 'NÃO ESPECIFICADO') -> dict:
    p = str(prod_str or '').strip()

    parsed_exp = extract_expiration_from_text(p)
    validade_iso = parsed_exp.iso
    validade_display = parsed_exp.formatted

    lt_match = re.search(r'(?:LT|LOTE)\.?:?\s*([A-Za-z0-9\.\/-]+)', p, re.IGNORECASE)
    lote = lt_match.group(1).strip(' .-:,') if lt_match else 'N/I'

    parts = [part.strip() for part in p.split(' - ')]
    nome_limpo = parts[0] if parts else p
    fabricante = fallback_supplier.strip().upper() if fallback_supplier else 'NÃO ESPECIFICADO'

    return {
        'nome_limpo': nome_limpo,
        'fabricante': fabricante or 'NÃO ESPECIFICADO',
        'lote': lote or 'N/I',
        'validade_iso': validade_iso,
        'validade_display': validade_display,
    }


def fetch_all_smartpos_products(base_url: str, key_id: str, key_secret: str) -> list:
    headers = {
        'X-Api-Key-Id': key_id,
        'X-Api-Key-Secret': key_secret,
        'Accept': 'application/json',
        'User-Agent': 'SmartPOS-Daily-Sync/1.0',
    }
    page = 1
    size = 100
    all_items = []

    while True:
        url = f"{base_url.rstrip('/')}/products?page={page}&size={size}&archived=false"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as res:
            payload = json.loads(res.read().decode('utf-8'))

        items = payload.get('items') or []
        all_items.extend(items)
        total = int(payload.get('totalRecords') or len(all_items))
        if len(all_items) >= total or not items:
            break
        page += 1

    return all_items


def recompute_dataset(existing_data: dict, api_products: list, dry_run: bool = False) -> dict:
    existing_products = existing_data.get('products') or []
    by_code = {str(p.get('codigo', '')).strip(): p for p in existing_products if p.get('codigo')}
    api_by_code = {
        str(item.get('alphaCode', '')).strip(): item
        for item in api_products
        if item.get('alphaCode')
    }

    ref_date = datetime.now(timezone.utc).replace(tzinfo=None)
    updated_count = 0
    rebuilt_products = []

    for prod in existing_products:
        code = str(prod.get('codigo', '')).strip()
        api_item = api_by_code.get(code)

        produto_nome = prod['produto']
        custo = float(prod.get('custo') or 0.0)
        venda = float(prod.get('valor_venda') or 0.0)
        categoria = prod.get('categoria') or 'Outros'
        fabricante = prod.get('fabricante') or 'NÃO ESPECIFICADO'

        if api_item:
            updated_count += 1
            produto_nome = str(api_item.get('name') or produto_nome).strip()
            api_cost = float(api_item.get('costValue') or 0.0)
            api_sell = float(api_item.get('sellValue') or 0.0)
            if api_cost > 0:
                custo = round(api_cost, 2)
            if api_sell > 0:
                venda = round(api_sell, 2)
            cat_desc = (api_item.get('category') or {}).get('description')
            if cat_desc:
                categoria = str(cat_desc).strip()
            sup_name = (api_item.get('supplier') or {}).get('companyName')
            if sup_name:
                fabricante = str(sup_name).strip().upper()

        estoque = int(prod.get('estoque') or 0)
        minimo = prod.get('estoque_minimo')
        meta = extract_metadata(produto_nome, fallback_supplier=fabricante)

        # Preserva lote/validade existentes válidos quando o nome atualizado não traz marcador explícito
        if meta['validade_iso']:
            validade_iso = meta['validade_iso']
            validade_display = meta['validade_display']
        else:
            existing_parsed = parse_brazilian_expiration_date(
                prod.get('validade_iso') or prod.get('validade')
            )
            validade_iso = existing_parsed.iso if existing_parsed.valid else None
            validade_display = existing_parsed.formatted if existing_parsed.valid else 'N/I'
        lote = meta['lote'] if meta['lote'] != 'N/I' else prod.get('lote', 'N/I')

        lucro_unit = round(venda - custo, 2)
        margem_perc = round((lucro_unit / venda * 100), 1) if venda > 0 else 0.0
        markup_perc = round((lucro_unit / custo * 100), 1) if custo > 0 else 0.0

        valor_total_custo = round(custo * estoque, 2)
        valor_total_venda = round(venda * estoque, 2)
        lucro_potencial = round(valor_total_venda - valor_total_custo, 2)

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

        sugestao_qtd = 0
        sugestao_custo = 0.0
        if minimo is not None and estoque < minimo:
            sugestao_qtd = int(minimo - estoque)
            sugestao_custo = round(sugestao_qtd * custo, 2)

        dias_validade, status_validade = compute_expiration_status(
            validade_iso,
            ref_date=ref_date.date() if isinstance(ref_date, datetime) else ref_date,
        )

        rebuilt_products.append({
            **prod,
            'produto': produto_nome,
            'nome_resumido': meta['nome_limpo'],
            'fabricante': fabricante,
            'lote': lote,
            'validade_iso': validade_iso,
            'validade': validade_display,
            'dias_para_vencer': dias_validade,
            'status_validade': status_validade,
            'categoria': categoria,
            'custo': custo,
            'valor_venda': venda,
            'lucro_unitario': lucro_unit,
            'margem_percentual': margem_perc,
            'markup_percentual': markup_perc,
            'status_estoque': status_estoque,
            'sugestao_compra_qtd': sugestao_qtd,
            'sugestao_compra_custo': sugestao_custo,
            'valor_total_custo': valor_total_custo,
            'valor_total_venda': valor_total_venda,
            'lucro_potencial': lucro_potencial,
        })

    # Recalcula Curva ABC
    sorted_desc = sorted(rebuilt_products, key=lambda x: max(0.0, x['valor_total_venda']), reverse=True)
    total_venda_pos = sum(max(0.0, p['valor_total_venda']) for p in sorted_desc)
    acc = 0.0
    for p in sorted_desc:
        acc += max(0.0, p['valor_total_venda'])
        pct = (acc / total_venda_pos * 100) if total_venda_pos > 0 else 100.0
        p['curva_abc_acumulada_pct'] = round(pct, 2)
        p['curva_abc'] = 'A' if pct <= 80.0 else ('B' if pct <= 95.0 else 'C')

    rebuilt_products = sorted(sorted_desc, key=lambda x: str(x['codigo']))

    total_skus = len(rebuilt_products)
    total_unidades = sum(p['estoque'] for p in rebuilt_products)
    valor_total_custo = round(sum(p['valor_total_custo'] for p in rebuilt_products), 2)
    valor_total_venda = round(sum(p['valor_total_venda'] for p in rebuilt_products), 2)
    lucro_potencial_total = round(valor_total_venda - valor_total_custo, 2)
    margem_media = round(sum(p['margem_percentual'] for p in rebuilt_products) / total_skus, 2) if total_skus else 0.0
    markup_medio = round(sum(p['markup_percentual'] for p in rebuilt_products) / total_skus, 2) if total_skus else 0.0

    categories_map = {}
    for p in rebuilt_products:
        c = p['categoria']
        entry = categories_map.setdefault(c, {
            'categoria': c,
            'skus': 0,
            'unidades': 0,
            'valor_custo': 0.0,
            'valor_venda': 0.0,
            'lucro_potencial': 0.0,
            'itens_zerados': 0,
            'itens_criticos': 0,
        })
        entry['skus'] += 1
        entry['unidades'] += p['estoque']
        entry['valor_custo'] += p['valor_total_custo']
        entry['valor_venda'] += p['valor_total_venda']
        entry['lucro_potencial'] += p['lucro_potencial']
        if p['status_estoque'] == 'ZERADO':
            entry['itens_zerados'] += 1
        elif p['status_estoque'] == 'CRITICO':
            entry['itens_criticos'] += 1

    categories_list = sorted(categories_map.values(), key=lambda x: x['valor_venda'], reverse=True)
    for c in categories_list:
        c['valor_custo'] = round(c['valor_custo'], 2)
        c['valor_venda'] = round(c['valor_venda'], 2)
        c['lucro_potencial'] = round(c['lucro_potencial'], 2)
        c['participacao_venda_pct'] = round((c['valor_venda'] / valor_total_venda * 100), 2) if valor_total_venda > 0 else 0.0

    abc_summary = {
        cls: {
            'classe': cls,
            'skus': sum(1 for p in rebuilt_products if p['curva_abc'] == cls),
            'valor_venda': round(sum(p['valor_total_venda'] for p in rebuilt_products if p['curva_abc'] == cls), 2),
            'descricao': desc,
        }
        for cls, desc in [
            ('A', '80% do valor imobilizado (Alta Prioridade de Gestão)'),
            ('B', '15% do valor imobilizado (Média Prioridade)'),
            ('C', '5% do valor imobilizado (Cauda Longa / Giro Pontual)'),
        ]
    }

    # Horário UTC e BRT (UTC-3)
    now_utc = datetime.now(timezone.utc)
    # BRT fixo sem dependência externa
    brt_hour = (now_utc.hour - 3) % 24
    brt_day = now_utc.day if now_utc.hour >= 3 else now_utc.day - 1
    last_sync_at = now_utc.strftime('%Y-%m-%dT%H:%M:%SZ')
    last_sync_brt = f"{now_utc.strftime('%d/%m/%Y')} às {brt_hour:02d}:{now_utc.minute:02d} (BRT)"

    sync_metadata = {
        'last_sync_at': last_sync_at,
        'last_sync_brt': last_sync_brt,
        'sync_status': 'SUCCESS' if updated_count > 0 else 'WARNING',
        'produtos_api': len(api_products),
        'skus_conciliados': updated_count,
        'origem': 'SmartPOS API',
    }

    summary = {
        **existing_data.get('summary', {}),
        'total_skus': total_skus,
        'total_unidades': total_unidades,
        'valor_total_custo': valor_total_custo,
        'valor_total_venda': valor_total_venda,
        'lucro_potencial_total': lucro_potencial_total,
        'margem_media': margem_media,
        'markup_medio': markup_medio,
        'total_zerados': sum(1 for p in rebuilt_products if p['status_estoque'] == 'ZERADO'),
        'total_criticos': sum(1 for p in rebuilt_products if p['status_estoque'] == 'CRITICO'),
        'total_negativos': sum(1 for p in rebuilt_products if p['status_estoque'] == 'NEGATIVO'),
        'total_alertas': sum(1 for p in rebuilt_products if p['status_estoque'] in ('ZERADO', 'CRITICO', 'NEGATIVO')),
        'total_vencidos': sum(1 for p in rebuilt_products if p['status_validade'] == 'VENCIDO'),
        'total_vence_90d': sum(1 for p in rebuilt_products if p['status_validade'] == 'CRITICO_90D'),
        'total_vence_180d': sum(1 for p in rebuilt_products if p['status_validade'] == 'ATENCAO_180D'),
        'total_sugestao_compra_qtd': sum(p['sugestao_compra_qtd'] for p in rebuilt_products),
        'total_sugestao_compra_custo': round(sum(p['sugestao_compra_custo'] for p in rebuilt_products), 2),
        'curva_abc': abc_summary,
        'categorias': categories_list,
        'data_base': ref_date.strftime('%Y-%m-%d'),
        'origem': f'SmartPOS API Sync ({len(api_products)} catálogo / {updated_count} conciliados)',
        'last_sync_at': last_sync_at,
        'last_sync_brt': last_sync_brt,
        'sync_metadata': sync_metadata,
    }

    print(f"SmartPOS produtos recebidos: {len(api_products)} | SKUs conciliados: {updated_count}/{len(by_code)}")
    print(f"Resumo atualizado -> Custo: R$ {valor_total_custo:,.2f} | Venda: R$ {valor_total_venda:,.2f}")

    result = {'summary': summary, 'products': rebuilt_products}
    if not dry_run:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"Arquivo {DATA_FILE} atualizado com sucesso.")
    else:
        print("Modo --dry-run: nenhum arquivo alterado.")

    return result


def main() -> int:
    load_local_env_if_present()
    base_url = os.environ.get('SMARTPOS_BASE_URL', 'https://api.smartpos.app/v1')
    key_id = os.environ.get('SMARTPOS_KEY_ID', '').strip()
    key_secret = os.environ.get('SMARTPOS_KEY_SECRET', '').strip()

    if not key_id or not key_secret:
        print('ERRO: Defina SMARTPOS_KEY_ID e SMARTPOS_KEY_SECRET nas variáveis/Secrets antes de rodar.', file=sys.stderr)
        return 1

    dry_run = '--dry-run' in sys.argv

    try:
        api_products = fetch_all_smartpos_products(base_url, key_id, key_secret)
    except urllib.error.HTTPError as e:
        print(f'ERRO HTTP SmartPOS ({e.code}): {e.reason}', file=sys.stderr)
        return 1
    except Exception as ex:
        print(f'ERRO ao consultar SmartPOS: {ex}', file=sys.stderr)
        return 1

    with open(DATA_FILE, encoding='utf-8') as f:
        existing_data = json.load(f)

    recompute_dataset(existing_data, api_products, dry_run=dry_run)
    return 0


if __name__ == '__main__':
    sys.exit(main())


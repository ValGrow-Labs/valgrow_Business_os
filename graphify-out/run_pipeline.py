import json
from pathlib import Path
from graphify.detect import detect
from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html
from graphify.detect import save_manifest
from datetime import datetime, timezone

def run():
    root = Path('.').resolve()
    graphify_out = root / 'graphify-out'
    graphify_out.mkdir(exist_ok=True)

    print("Step 2: Detecting files...")
    detect_res = detect(root)
    (graphify_out / '.graphify_detect.json').write_text(json.dumps(detect_res, indent=2, ensure_ascii=False), encoding='utf-8')

    code_files = []
    for f in detect_res.get('files', {}).get('code', []):
        p = Path(f)
        code_files.extend(collect_files(p) if p.is_dir() else [p])

    print(f"Step 3: Extracting AST for {len(code_files)} code files...")
    if code_files:
        ast_res = extract(code_files, cache_root=root)
    else:
        ast_res = {'nodes': [], 'edges': [], 'input_tokens': 0, 'output_tokens': 0}

    (graphify_out / '.graphify_ast.json').write_text(json.dumps(ast_res, indent=2, ensure_ascii=False), encoding='utf-8')
    (graphify_out / '.graphify_semantic.json').write_text(json.dumps({'nodes': [], 'edges': [], 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}), encoding='utf-8')

    # Part C merge
    merged_nodes = list(ast_res['nodes'])
    merged_edges = list(ast_res['edges'])
    extraction = {
        'nodes': merged_nodes,
        'edges': merged_edges,
        'hyperedges': [],
        'input_tokens': 0,
        'output_tokens': 0
    }
    (graphify_out / '.graphify_extract.json').write_text(json.dumps(extraction, indent=2, ensure_ascii=False), encoding='utf-8')

    print(f"Step 4: Building graph ({len(merged_nodes)} nodes, {len(merged_edges)} edges)...")
    G = build_from_json(extraction, root=str(root), directed=False)
    if G.number_of_nodes() == 0:
        print("ERROR: Graph is empty.")
        exit(1)

    communities = cluster(G)
    cohesion = score_all(G, communities)
    tokens = {'input': 0, 'output': 0}
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    labels = {cid: f"Community {cid}" for cid in communities}
    questions = suggest_questions(G, communities, labels)

    wrote = to_json(G, communities, str(graphify_out / 'graph.json'))
    if not wrote:
        print("ERROR: Refused to shrink graphify-out/graph.json")
        exit(1)

    report = generate(G, communities, cohesion, labels, gods, surprises, detect_res, tokens, str(root), suggested_questions=questions)
    (graphify_out / 'GRAPH_REPORT.md').write_text(report, encoding='utf-8')

    analysis = {
        'communities': {str(k): v for k, v in communities.items()},
        'cohesion': {str(k): v for k, v in cohesion.items()},
        'gods': gods,
        'surprises': surprises,
        'questions': questions,
    }
    (graphify_out / '.graphify_analysis.json').write_text(json.dumps(analysis, indent=2, ensure_ascii=False), encoding='utf-8')

    to_html(G, communities, str(graphify_out / 'graph.html'))

    # Save manifest
    _corpus = detect_res.get('all_files') or detect_res['files']
    _scan = {f for fl in _corpus.values() for f in fl}
    save_manifest({}, root=str(root), scan_corpus=_scan)

    cost_path = graphify_out / 'cost.json'
    cost = {'runs': [{
        'date': datetime.now(timezone.utc).isoformat(),
        'input_tokens': 0,
        'output_tokens': 0,
        'files': detect_res.get('total_files', 0)
    }], 'total_input_tokens': 0, 'total_output_tokens': 0}
    cost_path.write_text(json.dumps(cost, indent=2, ensure_ascii=False), encoding='utf-8')

    print("Graphify build completed successfully!")

if __name__ == '__main__':
    run()

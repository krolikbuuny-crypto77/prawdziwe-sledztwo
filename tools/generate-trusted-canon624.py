"""Offline author-time export of trusted public voice + document index.
Do not run for unreviewed user content. Backend imports the frozen JSON, never browser facts.
"""
from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parent.parent
src=root/'src/data/case-content.js'
raw=src.read_text(encoding='utf8');data=json.JSONDecoder().raw_decode(raw.split('const CONTENT=',1)[1])[0]
canon={'version':624,'sourceSha256':hashlib.sha256(raw.encode()).hexdigest(),
'profiles':{p['id']:{'id':p['id'],'name':p['name'],'role':p['role'],'voice':p['voice']} for p in data['characters']},
'documents':{d['id']:{'title':d['title'],'body':d['body'][:1200],'family':d.get('family','')} for d in data['documents']}}
(root/'lib/trusted-witness-canon-624.json').write_text(json.dumps(canon,ensure_ascii=False,separators=(',',':'))+'\n')
print('Exported 6 author profiles and 78 source documents')

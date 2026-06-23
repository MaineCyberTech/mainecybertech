
import json, os
with open('dashboards/data/sample.json') as f:
 d=json.load(f)
os.makedirs('badges',exist_ok=True)
for k,v in d.items():
 open(f'badges/{k}.svg','w').write(f'<svg><text>{k}:{v}</text></svg>')

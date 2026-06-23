
import json, os
with open('dashboards/data/sample_data.json') as f:
 data=json.load(f)
os.makedirs('badges',exist_ok=True)
for k in data:
 with open(f'badges/{k}.svg','w') as f:
  f.write(f'<svg><text>{k}:{data[k]}</text></svg>')

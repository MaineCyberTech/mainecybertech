
import json, time, os
os.makedirs('dashboards/data/history',exist_ok=True)
ts=str(int(time.time()))
with open('dashboards/data/sample_data.json') as f:
 data=json.load(f)
with open(f'dashboards/data/history/{ts}.json','w') as f:
 json.dump(data,f,indent=2)


import json

def reconcile(findings):
 # deduplicate by file+issue
 seen=set()
 result=[]
 for f in findings:
  key=(f.get('file'),f.get('issue'))
  if key not in seen:
   seen.add(key)
   result.append(f)
 return result

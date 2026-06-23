
import json

def compute_global_risk(findings):
 p0 = sum(1 for f in findings if f.get('severity')=='P0')
 p1 = sum(1 for f in findings if f.get('severity')=='P1')
 score = max(0, 100 - (p0*40 + p1*10))
 return {"p0":p0,"p1":p1,"score":score}

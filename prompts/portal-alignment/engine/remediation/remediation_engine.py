
import json

def generate_fixes(findings):
 fixes=[]
 for f in findings:
  fixes.append({"file":f.get("file"),"action":"fix","severity":f.get("severity")})
 return fixes

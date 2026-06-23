
import json

def merge_all(*datasets):
 merged=[]
 for d in datasets:
  merged.extend(d)
 return merged


import os, json

def load_history(path):
 runs=[]
 for f in sorted(os.listdir(path)):
  with open(os.path.join(path,f)) as fp:
   runs.append(json.load(fp))
 return runs


import json, os, difflib

def diff_runs(old,new):
 return list(difflib.unified_diff(old.splitlines(),new.splitlines()))

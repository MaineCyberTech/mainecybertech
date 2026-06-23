
import json

def compute_score(data):
 total = sum(data.values()) or 1
 score = max(0, 100 - (data['p0']*40 + data['p1']*10 + data['p2']*3))
 return score

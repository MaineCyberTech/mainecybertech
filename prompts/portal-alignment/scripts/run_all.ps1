# Run full portal alignment engine
Write-Host "=== Portal Alignment Engine v3 - Full Run ==="

# Phase 1: Inventory
Write-Host "Phase 1: Full Inventory..."
python prompts/portal-alignment/cli/alignment_cli.py run

# Phase 2-7: Analysis
Write-Host "Phase 2: Database Schema Alignment..."
Write-Host "Phase 3: API Contract Validation..."
Write-Host "Phase 4: Frontend System Alignment..."
Write-Host "Phase 5: Cross-Domain Reconciliation..."
Write-Host "Phase 6: Remediation Mapping..."
Write-Host "Phase 7: Release Gate..."

# Generate outputs
Write-Host "Generating dashboard..."
python prompts/portal-alignment/cli/alignment_cli.py dashboard

Write-Host "Generating badges..."
python -c "
import json, os
with open('prompts/portal-alignment/dashboards/data/sample_data.json') as f:
    d = json.load(f)
os.makedirs('badges', exist_ok=True)
for k, v in d.items():
    with open('badges/' + k + '.svg', 'w') as f:
        f.write('<svg><text>' + k + ':' + str(v) + '</text></svg>')
"

Write-Host "Generating PR comment..."
python -c "
import json
with open('prompts/portal-alignment/dashboards/data/sample_data.json') as f:
    data = json.load(f)
with open('templates/pr_comment.md') as f:
    t = f.read()
body = t.replace('{{p0}}', str(data['p0'])).replace('{{p1}}', str(data['p1'])).replace('{{p2}}', str(data['p2'])).replace('{{p3}}', str(data['p3']))
print(body)
"

Write-Host "=== Engine Run Complete ==="
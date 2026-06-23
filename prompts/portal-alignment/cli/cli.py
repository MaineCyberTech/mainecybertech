
import sys
cmd=sys.argv[1] if len(sys.argv)>1 else ''
if cmd=='run': print('run')
elif cmd=='analyze': print('analyze')
elif cmd=='remediate': print('remediate')
elif cmd=='dashboard': print('dashboard')


import json, os, sys

COMMANDS=["run","diff","history","dashboard"]

cmd=sys.argv[1] if len(sys.argv)>1 else None

if cmd=='run': print('Running full alignment engine')
elif cmd=='diff': print('Running diff engine')
elif cmd=='history': print('Showing history')
elif cmd=='dashboard': print('Generating dashboard')
else: print('Commands:',COMMANDS)

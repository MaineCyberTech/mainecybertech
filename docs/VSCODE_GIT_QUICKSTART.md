# VS Code Git Quickstart

## Most common UI flow
1. Open repo in VS Code
2. Open Source Control (`Ctrl+Shift+G`)
3. Create new branch from bottom status bar
4. Edit files
5. Review diffs in Source Control
6. Stage files with `+`
7. Type commit message
8. Commit
9. Push
10. Open PR

## Most common terminal flow
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-change
# edit files
pnpm build
pnpm lint
pnpm test
git add .
git commit -m "Describe the change"
git push -u origin feature/my-change
```

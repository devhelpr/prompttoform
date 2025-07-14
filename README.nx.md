npx nx g @nx/react:lib libs/react-forms --publishable --importPath=@devhelpr/react-forms

for info about publishing:
https://nx.dev/core-features/manage-releases


## Test publish
npx nx release --projects=react-forms patch --dry-run

## Publish steps
npm run build

npm login --scope=@devhelpr
npx nx release --projects=react-forms patch




=======================

just npx nx build doesnt'work
this does work: npm run build


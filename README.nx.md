npx nx g @nx/react:lib libs/react-forms --publishable --importPath=@devhelpr/react-forms

for info about publishing:
https://nx.dev/core-features/manage-releases



nx release --dry-run



npx nx build <project> 
npx nx run-many -t build

just npx nx build doesnt'work
this does work: npm run build

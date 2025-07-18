npx nx g @nx/react:lib libs/react-forms --publishable --importPath=@devhelpr/react-forms

for info about publishing:
https://nx.dev/core-features/manage-releases


## Test publish
npx nx release --projects=react-forms patch --dry-run

## Publish steps
npx nx build react-forms

npm login --scope=@devhelpr
npx nx release --projects=react-forms patch




=======================
npx nx release --projects=react-forms patch -- --otp=YOUR_OTP

npx nx build <project> 
npx nx run-many -t build

just npx nx build doesnt'work
this does work: npm run build

manual publish:
npm publish --access public
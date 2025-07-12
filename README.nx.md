npx nx g @nx/react:lib libs/react-forms --publishable --importPath=@devhelpr/react-forms

for info about publishing:
https://nx.dev/core-features/manage-releases



npx nx release --projects=react-forms patch --dry-run

npm login --scope=@devhelpr
npx nx release --projects=react-forms patch

npx nx ryelease --projects=react-forms patch -- --otp=YOUR_OTP

npx nx build <project> 
npx nx run-many -t build

just npx nx build doesnt'work
this does work: npm run build

npm run publish

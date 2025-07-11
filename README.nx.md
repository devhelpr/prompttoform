npx nx g @nx/react:lib libs/react-forms --publishable --importPath=@devhelpr/react-forms

for info about publishing:
https://nx.dev/core-features/manage-releases


nx release --dry-run




# 1. Build the library first
npx nx run react-forms:vite:build

# 2. Version and create git commit/tag
npx nx release version patch --projects=react-forms --git-commit --git-tag --git-push

# 3. Publish to npm


npx nx release version patch --git-commit --git-tag --git-push

npx nx release publish --access=public

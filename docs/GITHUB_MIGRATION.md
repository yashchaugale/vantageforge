# GitHub migration runbook

Current remote:

```text
https://github.com/yashchaugale/vantageforge.git
```

Target display name: **You Can't Trade**
Target slug: `you-cant-trade`

## Safe procedure

1. Make and verify a local backup/clone.
2. Commit documentation and later implementation changes on the current branch; do not rewrite history.
3. Rename the repository using GitHub's repository settings (or an authenticated GitHub tool). Do not claim this is complete until the remote confirms it.
4. Update the local remote:

   ```bash
   git remote set-url origin https://github.com/yashchaugale/you-cant-trade.git
   git remote -v
   git fetch origin
   git log --oneline --decorate -5
   ```

5. Push the preserved branch normally: `git push origin main`.
6. Clone the new URL into a temporary directory and run the smoke test before removing or archiving the old URL.

GitHub normally redirects the old URL after a rename, but the application, extension, package metadata, credentials, database files, and compatibility aliases still require the separate migration plan in `docs/AUDIT.md`. Never force-push or delete the old history as part of the rename.

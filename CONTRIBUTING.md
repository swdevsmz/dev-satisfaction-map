# Contributing to dev-satisfaction-map

Thank you for considering a contribution.

## Ways to contribute

- Report bugs with clear reproduction steps
- Propose new data sources or scoring improvements
- Improve documentation and data transparency
- Fix UI, accessibility, performance, or reliability issues
- Add tests for existing or new behavior

Before starting a larger change, please open an Issue so the approach can be discussed first.

## Development setup

```bash
npm install
npm run dev
```

Create `.env.local` and configure the required Supabase values as described in the README.

## Quality checks

Before opening a pull request, run:

```bash
npm run lint
npm run build
```

If your change affects scoring or data processing, add or update the relevant tests as well.

## Pull requests

1. Create a branch from `main`.
2. Keep changes focused on one issue or purpose.
3. Use clear commit messages.
4. Explain what changed and how it was verified in the PR description.
5. Link the related Issue, for example `Closes #123`.

## Data sources and responsible use

Contributors are responsible for respecting the terms of service, robots policies, licenses, privacy requirements, and applicable laws for every external data source. Do not commit credentials, cookies, API keys, personal data, or other secrets.

## Scoring changes

Changes to scoring logic should document:

- the input data used
- normalization or weighting changes
- missing-data behavior
- expected impact on existing scores
- tests demonstrating the intended behavior

## Code of conduct

Be respectful and constructive. Technical disagreement is welcome; harassment and personal attacks are not.

## License

By contributing, you agree that your contributions will be licensed under the MIT License used by this repository.

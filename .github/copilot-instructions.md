# GitHub Copilot Instructions

## UI implementation checklist

- [ ] When `REACT_APP_ABTEST=b`, make every route fill the viewport width and at least the full viewport height (`100vw` width and `100vh` minimum height); allow vertical scrolling when page content exceeds the viewport.
- [ ] Apply the `apex-theme` class for variant B so the shared color, component, layout, and typography styles are active on every page.
- [ ] Reuse the shared styles and tokens from `src/styles/theme-colors.css`, `src/styles/theme-components.css`, `src/styles/theme-layout.css`, and `src/styles/theme-typography.css`; avoid conflicting one-off colors, type, and spacing.
- [ ] Keep variant A behavior and presentation unchanged.
- [ ] Verify both A and B builds and check responsive layouts without horizontal overflow.

# Project Guidelines

## Project
- This is a React and Redux cricket simulator that uses Firebase for authentication and game saves.
- Follow the existing patterns in the relevant feature, component, and service files.

## Code Changes
- Keep changes focused and avoid unrelated refactoring.
- Preserve existing gameplay behavior and user-facing flows.
- Keep Firebase access in the existing service layer and state updates in the relevant Redux slices.
- Do not commit secrets or local environment files.
- Keep every authored code file, including tests and stylesheets, at 500 lines or fewer. Split larger files into focused modules or utility files, reuse common helpers where appropriate, and preserve behavior with tests.
- Follow consistent naming conventions for files, components, and functions to improve code clarity and maintainability.
- Check prettier and ESLint formatting with `npm run format` and `npm run lint` before committing.

## Validation
- Run `npm test` for relevant tests and `npm run build` to verify production builds.
- Add or update tests when changing existing behavior.

# Testing Workflow
- For every implementation request, identify the relevant tests and create or update them to express the requested behavior before changing the implementation. Run those tests first when practical and confirm they fail for the expected reason.
- After implementation, review the relevant test files, update them to match the final behavior, and run the focused tests. Report the results and any checks that could not be run.
- In this repository, use `npm test` for the test suite and `npm run test:coverage` to check configured per-file JavaScript coverage thresholds.
- For core functionality, ensure that the essential tests are always up-to-date and passing before making any changes to the implementation.
- Create MD files for new features or significant changes to document their usage and behavior. also update existing documentation as needed.
- Ensure that any changes to environment variables or configuration files are reflected in the documentation.

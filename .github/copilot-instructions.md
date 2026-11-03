# GitHub Copilot Instructions

## UI implementation checklist

- [ ] When `REACT_APP_ABTEST=b`, make every route fill the viewport width and at least the full viewport height (`100vw` width and `100vh` minimum height); allow vertical scrolling when page content exceeds the viewport.
- [ ] Apply the `apex-theme` class for variant B so the shared color, component, layout, and typography styles are active on every page.
- [ ] Reuse the shared styles and tokens from `src/styles/theme-colors.css`, `src/styles/theme-components.css`, `src/styles/theme-layout.css`, and `src/styles/theme-typography.css`; avoid conflicting one-off colors, type, and spacing.
- [ ] Keep variant A behavior and presentation unchanged.
- [ ] Verify both A and B builds and check responsive layouts without horizontal overflow.

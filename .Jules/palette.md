# Palette's UX & Accessibility Journal

## 2025-02-18 - Core Shared Component Accessibility Pattern
**Learning:** In highly modular Next.js application architectures (like this school management system), page-level forms, models, and actions heavily rely on a small set of common/shared components (`Input.js`, `Button.js`, `Modal.js`, `Badge.js`). When these core components lack fundamental WAI-ARIA and accessibility relationships, assistive technology completely loses the context of loading states, error states, and modal structures throughout the entire system.
**Action:** When designing or refactoring shared design system components:
1. Ensure `Input` elements dynamically link `error` text using `aria-invalid` and `aria-describedby` to provide screen reader users with precise inline validation feedback.
2. Ensure `Button` loading states utilize `aria-busy` and that all nested decorative visual elements (such as SVGs/Lucide icons) are explicitly set to `aria-hidden="true"`.
3. Ensure custom wrappers like `Modal` adhere to full dialog requirements (`role="dialog"`, `aria-modal="true"`, and automatic labeling via `aria-labelledby`).

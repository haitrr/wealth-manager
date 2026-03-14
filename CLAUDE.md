# Coding guideline
- Use `eslint` for linting JavaScript/TypeScript code `pmpm exec eslint <path>` or `pmpm exec eslint .` for the entire project.
- Components should be inside their own file unless they are very small (under 10 lines) and only used in one place.
- Avoid file with more than 300 lines of code. If a file exceeds this, consider breaking it into smaller components or modules.
- Don't put complex logic inside the main component body. Instead, extract it into helper functions or custom hooks to keep the component clean and focused on rendering.
- The app is mobile first, so make sure to test on mobile devices and use responsive design techniques to ensure a good user experience across different screen sizes.
- For the UI, use shadcn, dark/light change by os preference.
- Call API using react-query, and use axios for making HTTP requests. Create a separate file for API calls to keep the code organized.
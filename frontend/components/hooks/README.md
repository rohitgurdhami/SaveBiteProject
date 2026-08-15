# hooks/

Shared custom React hooks for SaveBite client components.

Current hooks:

- `useApiQuery` handles authenticated GET requests with loading, error, data,
  and refetch state.
- `useAuthSession` reads, saves, and clears the auth values stored in
  `localStorage`.
- `useDebounce` delays rapidly changing values such as search input.
- `useTheme` applies and toggles the app's persisted light/dark theme.
- `index.ts` re-exports the shared hooks and their public types.

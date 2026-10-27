<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep import validation and chunking in a browser-safe library, and load SheetJS dynamically only when a file is selected, to keep file parsing out of initial rendering.
- Import writes use the existing Supabase client and shared leads query cache; never require schema changes for file imports.

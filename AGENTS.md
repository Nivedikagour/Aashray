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

## Application architecture
- Keep the visual dashboard and transient project interactions client-side; do not imply saved persistence or live AI until those services are connected.
- Use the global semantic design tokens and shared UI controls for every dashboard view so styling stays consistent.
- Keep bundled concept imagery distinct from measured architectural geometry; visual previews are not 3D models.

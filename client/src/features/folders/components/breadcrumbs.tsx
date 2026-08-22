/** Renders keyboard-operable virtual-root and owned-folder breadcrumbs. */
export function Breadcrumbs({
  items,
  onNavigate,
}: {
  items: Array<{ id: string; name: string }>;
  onNavigate: (id: string | null) => void;
}) {
  return (
    <nav aria-label="Folder breadcrumbs">
      <ol>
        <li>
          <button
            type="button"
            onClick={
              /** Handles the bound UI event or state projection for this JSX control. */ () =>
                onNavigate(null)
            }
          >
            My Files
          </button>
        </li>
        {items.map(
          /** Maps one source item into its derived public representation. */ (
            item,
          ) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={
                  /** Handles the bound UI event or state projection for this JSX control. */ () =>
                    onNavigate(item.id)
                }
              >
                {item.name}
              </button>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}

import { Header } from '@/components/layout/Header';

/**
 * Scaffold route.
 *
 * The target architecture calls for a dedicated `browse-food` section. Today,
 * browsing available donated food is handled by `(dashboard)/donations`, which
 * the sidebar already links to as "Browse Donations". This route is reserved
 * for when that experience is split out (e.g. browsing food listings distinct
 * from donation requests) so the folder exists ahead of time without changing
 * any current navigation or behavior.
 */
export default function BrowseFoodPage() {
  return (
    <div>
      <Header title="Browse Food" description="Discover food available near you" />
      <div className="p-6">
        <p className="text-muted-foreground">
          This section is reserved for a future dedicated food-browsing experience.
          In the meantime, see the Donations page to browse what&apos;s currently available.
        </p>
      </div>
    </div>
  );
}

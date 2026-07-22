import { Header } from '@/components/layout/Header';

/**
 * Scaffold route.
 *
 * The target architecture calls for a dedicated `settings` section, separate
 * from `profile`. Today, account fields (name, phone, address, etc.) all live
 * on the Profile page, and the header's settings icon links to `/profile`.
 * This route is reserved for when account settings (notifications, security,
 * preferences) are split out from personal profile info, without changing the
 * current Header link or Profile page behavior.
 */
export default function SettingsPage() {
  return (
    <div>
      <Header title="Settings" description="Manage your account preferences" />
      <div className="p-6">
        <p className="text-muted-foreground">
          This section is reserved for account settings such as notification
          preferences and security options. For now, manage your details on
          the Profile page.
        </p>
      </div>
    </div>
  );
}

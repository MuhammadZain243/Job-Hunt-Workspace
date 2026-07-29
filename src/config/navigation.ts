export type NavItem = {
  title: string;
  href: string;
  /** Lucide-style icon name used by the shell icon map. */
  icon: string;
  enabled: boolean;
  comingSoon?: boolean;
};

export const settingsNavItems: NavItem[] = [
  {
    title: "Storage",
    href: "/settings/storage",
    icon: "hard-drive",
    enabled: true,
  },
  {
    title: "OpenAI",
    href: "/settings/openai",
    icon: "sparkles",
    enabled: true,
  },
  {
    title: "Gmail",
    href: "/settings/gmail",
    icon: "mail",
    enabled: false,
    comingSoon: true,
  },
  {
    title: "LinkedIn",
    href: "/settings/linkedin",
    icon: "users",
    enabled: false,
    comingSoon: true,
  },
];

export const workspaceNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "layout-dashboard",
    enabled: true,
  },
  {
    title: "Companies",
    href: "/companies",
    icon: "building-2",
    enabled: true,
  },
  {
    title: "Jobs",
    href: "/jobs",
    icon: "briefcase",
    enabled: true,
  },
  {
    title: "Applications",
    href: "/applications",
    icon: "kanban",
    enabled: true,
  },
  {
    title: "Outreach",
    href: "/outreach",
    icon: "mail",
    enabled: true,
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: "users",
    enabled: true,
  },
  {
    title: "Email Sequences",
    href: "/email-sequences",
    icon: "waypoints",
    enabled: false,
    comingSoon: true,
  },
  {
    title: "CV Library",
    href: "/cv-library",
    icon: "file-text",
    enabled: true,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "settings",
    enabled: true,
  },
];

export const mobilePrimaryNav = workspaceNavItems.filter((item) =>
  ["Dashboard", "Jobs", "CV Library", "Settings"].includes(item.title),
);

export type NavItem = {
  title: string;
  href: string;
  icon:
    | "layout-dashboard"
    | "building-2"
    | "briefcase"
    | "kanban"
    | "users"
    | "mail"
    | "file-text"
    | "settings";
  enabled: boolean;
  comingSoon?: boolean;
};

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
    enabled: false,
    comingSoon: true,
  },
  {
    title: "Jobs",
    href: "/jobs",
    icon: "briefcase",
    enabled: false,
    comingSoon: true,
  },
  {
    title: "Applications",
    href: "/applications",
    icon: "kanban",
    enabled: false,
    comingSoon: true,
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: "users",
    enabled: false,
    comingSoon: true,
  },
  {
    title: "Email Sequences",
    href: "/email-sequences",
    icon: "mail",
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
  ["Dashboard", "CV Library", "Settings"].includes(item.title),
);

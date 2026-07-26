export type NavItem = { label: string; href: string; external?: boolean };

export const publicNav: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Games', href: '/games' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Events', href: '/events' },
  { label: 'Gekko Cup', href: '/tournament' },
  { label: 'Blog', href: '/blog' },
  { label: 'YouTube', href: 'https://youtube.com/@ggyt69', external: true },
];

export const footerSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Platform',
    items: [
      { label: 'About', href: '/about' },
      { label: 'Games', href: '/games' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Events', href: '/events' },
      { label: 'Gekko Cup', href: '/tournament' },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Members', href: '/members' },
      { label: 'Blog', href: '/blog' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Roadmap', href: '/roadmap' },
    ],
  },
  {
    title: 'Help',
    items: [
      { label: 'Contact', href: '/contact' },
      { label: 'Support', href: '/support' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
];

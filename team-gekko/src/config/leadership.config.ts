export type LeadershipMember = {
  id: string;
  name: string;
  role: string;
  roleShort: string;
  bio: string;
  image: string;
  portfolio?: string;
  accent: 'gekko' | 'violet' | 'cyan' | 'pink' | 'amber';
  badges?: string[];
};

export const leadership: LeadershipMember[] = [
  {
    id: 'president',
    name: 'Sheikh Mohammad Rajking',
    role: 'President',
    roleShort: 'President',
    bio: 'Leads the Team Gekko community — sets vision, organises initiatives, and keeps the team moving forward together.',
    image: '/team/president-sm-rajking.png',
    portfolio: 'https://smrajking.vercel.app/',
    accent: 'gekko',
    badges: ['Community lead', 'Strategy'],
  },
  {
    id: 'vice-president',
    name: 'Uday Barua',
    role: 'Vice President',
    roleShort: 'VP',
    bio: 'Partners with the President to run day-to-day operations, support member success, and bridge the work across teams.',
    image: '/team/vp-uday-barua.png',
    accent: 'violet',
    badges: ['Operations', 'Member success'],
  },
  {
    id: 'general-secretary',
    name: 'A.M. Asik Ifthaker Hamim',
    role: 'General Secretary',
    roleShort: 'Gen Sec',
    bio: 'AI engineer and researcher. Runs the platform that keeps the squad connected and helps members compete at their best.',
    image: '/team/secretary-asik-hamim.png',
    portfolio: 'https://asik-ifthaker-hamim.netlify.app/',
    accent: 'cyan',
    badges: ['AI Engineer', 'Research'],
  },
];

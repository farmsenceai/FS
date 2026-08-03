// src/components/layout/navConfig.js
export const NAV = [
  {
    section: 'MAIN',
    items: [
      { label: 'Dashboard',          path: '/dashboard',           icon: 'LayoutDashboard' },
      { label: 'Live Farm View',     path: '/live-farm-view',      icon: 'Video' },
      { label: 'Ongoing Projects',   path: '/ongoing-projects',    icon: 'Clock' },
      { label: 'Completed Projects', path: '/completed-projects',  icon: 'CheckCircle' },
      { label: 'Project Manager',    path: '/project-manager',     icon: 'UserCog' },
      { label: 'Download Reports',   path: '/download-reports',    icon: 'Download' },
      { label: 'Payments',           path: '/payments',            icon: 'CreditCard' },
    ]
  },
  {
    section: 'FARM OPERATIONS',
    items: [
      { label: 'Batch Management',   path: '/batch-management',    icon: 'Package' },
      { label: 'Birds Health',       path: '/birds-health',        icon: 'Heart' },
      { label: 'Feed & Water',       path: '/feed-and-water',      icon: 'Droplets' },
      { label: 'Environment',        path: '/environment',         icon: 'Wind' },
      { label: 'Performance',        path: '/performance',         icon: 'BarChart2' },
      { label: 'AI Insights',        path: '/ai-insights',         icon: 'Brain' },
    ]
  },
  {
    section: 'FINANCIAL INTELLIGENCE',
    items: [
      { label: 'Financial Overview', path: '/financial-overview',  icon: 'TrendingUp' },
      { label: 'Profit Forecast',    path: '/profit-forecast',     icon: 'LineChart' },
      { label: 'Batchwise Revenue',  path: '/batchwise-revenue',   icon: 'DollarSign' },
      { label: 'Historical Reports', path: '/historical-reports',  icon: 'FileText' },
      { label: 'Cost Intelligence',  path: '/cost-intelligence',   icon: 'PieChart' },
    ]
  },
  {
    section: 'KNOWLEDGE CENTER',
    items: [
      { label: 'Courses Overview',      path: '/courses',          icon: 'BookOpen' },
      { label: 'Learning in Progress',  path: '/learning',         icon: 'GraduationCap' },
      { label: 'SOPs & Checklists',     path: '/sops',             icon: 'ClipboardList' },
      { label: 'My Certificates',       path: '/certificates',     icon: 'Award' },
    ]
  }
]
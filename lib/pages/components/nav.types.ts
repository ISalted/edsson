export const NAV = {
  Administration: {
    Authorization: [
      "User Accounts",
      "Groups",
      "User roles",
      "Security settings",
      "Locked IP addresses",
    ],
    Tenants: [],
    "Lock Manager": [],
    "Job Manager": [],
    "Log Manager": [],
    Tools: [],
  },
  AI: {
    "AI Chat": [],
    "Questionnaire Chats": [],
  },
  Marketing: {
    Technologies: [],
    "Site Activities": [],
    "Potential customers": [],
    "Team Requests": [],
    Settings: [
      "Technology categories",
      "Potential customer areas",
      "Add-On Services",
    ],
  },
  Sales: {
    Requests: [],
    Proposal: ["Contact persons", "Proposals", "Articles"],
    Companies: [],
    Prices: [],
    Contracts: [],
    Projects: [],
    Invoices: [],
    Settings: [
      "Contractors",
      "Contract type",
      "Bonus hours",
      "Request categories",
    ],
  },
  Production: {
    "Resource Planning": [],
    Activities: [],
    Topics: [],
    "Time Reports": [],
    Settings: [
      "Topic Statuses",
      "Topic Phases",
      "Activity types",
    ],
  },
  Finance: {
    "Payment Requests": [],
    "Payment Orders": [],
    "Incoming Payments": [],
    Acts: [],
    Payrolls: [],
    Budget: [],
    "Budget Lines": [],
    Integration: [],
    Settings: [
      "Transaction types",
      "Exchange rates",
      "Currencies",
      "Bank API Settings",
      "GIG Settings",
    ],
  },
  Analytics: {
    "Resource costs": [],
    "Project costs": [],
    "Requests productivity": [],
    KPIs: [],
    "Change request costs": [],
    Settings: ["Resource rates"],
  },
  Resources: {
    Employees: [],
    Holidays: [],
  },
  Website: {
    "Success stories": [],
    Services: [],
    "Edsson LAB": [],
    Jobs: [],
  },
} as const;

export type TopNav = keyof typeof NAV;

export type SubNav<T extends TopNav> = keyof (typeof NAV)[T];

export type SubSubNav<
  T extends TopNav,
  S extends SubNav<T>,
> = (typeof NAV)[T][S] extends readonly string[] ? (typeof NAV)[T][S][number] : never;

export type DashboardRecentActivityItem = {
  kind: 'lodging' | 'contact' | 'user';
  action: 'created' | 'updated';
  entityId: string;
  title: string;
  timestamp: string;
};

export type DashboardAlert = {
  code:
    | 'LODGING_WITHOUT_CONTACT'
    | 'USER_PENDING_ACTIVATION'
    | 'CONTACT_INCOMPLETE'
    | 'INACTIVE_LODGINGS_PRESENT';
  severity: 'info' | 'warning';
  count: number;
  message: string;
};

export type DashboardSummaryResponse = {
  generatedAt: string;
  ownerScope: {
    ownerId: string;
    role: string;
  };
  metrics: {
    lodgings: {
      total: number;
      active: number;
      inactive: number;
      withAvailability: number;
      withoutContact: number;
    };
    contacts: {
      total: number;
      active: number;
      inactive: number;
      defaults: number;
      withEmail: number;
      withWhatsapp: number;
      incomplete: number;
    };
    users: {
      total: number;
      active: number;
      inactive: number;
      passwordSet: number;
      pendingActivation: number;
      neverLoggedIn: number;
    };
  };
  distributions: {
    lodgingsByCity: Array<{
      city: string;
      total: number;
      active: number;
      inactive: number;
    }>;
    lodgingsByType: Array<{
      type: string;
      total: number;
    }>;
  };
  recentActivity: {
    items: DashboardRecentActivityItem[];
    // `action` y `timestamp` son una vista heuristica derivada de timestamps,
    // no un event log persistido.
    source: 'timestamps' | 'none';
  };
  alerts: DashboardAlert[];
};

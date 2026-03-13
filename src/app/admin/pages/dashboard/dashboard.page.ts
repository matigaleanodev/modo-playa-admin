import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButtons,
  IonCard,
  IonContent,
  IonFooter,
  IonHeader,
  IonMenuButton,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { resolveLoadErrorMessage } from '@core/utils/load-error.util';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardSummaryResponse } from '../../models/dashboard-summary.model';

type DashboardMetricCard = {
  label: string;
  value: string;
  hint: string;
  route?: string;
};

type DashboardListItem = {
  title: string;
  subtitle: string;
  meta: string;
  tone?: 'neutral' | 'warning';
};

type DashboardCityRow = {
  city: string;
  lodgings: number;
  active: number;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    RouterLink,
    IonCard,
    IonContent,
    IonFooter,
    IonSkeletonText,
  ],
})
export class DashboardPage implements OnInit {
  private readonly _dashboardService = inject(DashboardService);

  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly summary = signal<DashboardSummaryResponse | null>(null);

  readonly metrics = computed<DashboardMetricCard[]>(() => {
    const summary = this.summary();
    if (!summary) return [];

    const { lodgings, contacts, users } = summary.metrics;
    return [
      {
        label: 'Alojamientos activos',
        value: String(lodgings.active),
        hint: `${lodgings.inactive} inactivos / ${lodgings.total} total`,
        route: '/app/lodgings',
      },
      {
        label: 'Contactos configurados',
        value: String(contacts.total),
        hint: `${contacts.active} activos, ${contacts.defaults} por defecto`,
        route: '/app/contacts',
      },
      {
        label: 'Usuarios del Administrador',
        value: String(users.total),
        hint: `${users.active} activos, ${users.pendingActivation} pendientes`,
        route: '/app/users',
      },
      {
        label: 'Disponibilidad cargada',
        value: String(lodgings.withAvailability),
        hint: `${lodgings.withoutContact} sin contacto asociado`,
      },
    ];
  });

  readonly lodgingHealth = computed<DashboardListItem[]>(() => {
    const summary = this.summary();
    if (!summary) return [];

    const lodgings = summary.metrics.lodgings;
    const percentage =
      lodgings.total > 0
        ? Math.round((lodgings.withAvailability / lodgings.total) * 100)
        : 0;

    return [
      {
        title: 'Disponibilidad cargada',
        subtitle: `${lodgings.withAvailability} alojamientos con calendario de ocupación cargado`,
        meta: `${percentage}% del catálogo`,
      },
      {
        title: 'Sin contacto asociado visible',
        subtitle: `${lodgings.withoutContact} alojamientos necesitan un contacto asignado`,
        meta: 'Validar antes de publicar',
        tone: lodgings.withoutContact > 0 ? 'warning' : 'neutral',
      },
      {
        title: 'Publicaciones inactivas',
        subtitle: `${lodgings.inactive} alojamientos están ocultos o desactivados`,
        meta: 'Posible limpieza de catálogo',
        tone: lodgings.inactive > 0 ? 'warning' : 'neutral',
      },
    ];
  });

  readonly recentActivity = computed<DashboardListItem[]>(() => {
    const summary = this.summary();
    if (!summary) return [];

    return summary.recentActivity.items.map((item) => ({
      title: item.title,
      subtitle: this._activitySubtitle(item.kind, item.action),
      meta: this._timeAgo(item.timestamp),
      tone: item.kind === 'user' && item.action === 'created' ? 'warning' : 'neutral',
    }));
  });

  readonly cityDistribution = computed<DashboardCityRow[]>(() => {
    const summary = this.summary();
    if (!summary) return [];

    return summary.distributions.lodgingsByCity.map((row) => ({
      city: row.city,
      lodgings: row.total,
      active: row.active,
    }));
  });

  readonly adminTasks = computed<DashboardListItem[]>(() => {
    const summary = this.summary();
    if (!summary) return [];

    return summary.alerts.map((alert) => ({
      title: alert.message,
      subtitle: `${alert.count} elemento(s) para revisar`,
      meta: this._alertScope(alert.code),
      tone: alert.severity === 'warning' ? 'warning' : 'neutral',
    }));
  });

  readonly hasMetrics = computed(() => this.metrics().length > 0);
  readonly hasLodgingHealth = computed(() => this.lodgingHealth().length > 0);
  readonly hasRecentActivity = computed(() => this.recentActivity().length > 0);
  readonly hasCityDistribution = computed(() => this.cityDistribution().length > 0);
  readonly hasAdminTasks = computed(() => this.adminTasks().length > 0);

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const result = await firstValueFrom(this._dashboardService.getSummary());
      this.summary.set(result);
    } catch (error) {
      this.summary.set(null);
      this.loadError.set(resolveLoadErrorMessage(error, 'el resumen del dashboard'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private _activitySubtitle(kind: 'lodging' | 'contact' | 'user', action: 'created' | 'updated'): string {
    const kindLabel: Record<'lodging' | 'contact' | 'user', string> = {
      lodging: 'Alojamiento',
      contact: 'Contacto',
      user: 'Usuario',
    };

    const actionLabel: Record<'created' | 'updated', string> = {
      created: 'agregado recientemente',
      updated: 'actualizado recientemente',
    };

    return `${kindLabel[kind]} ${actionLabel[action]}`;
  }

  private _alertScope(code: string): string {
    if (code.includes('LODGING')) return 'Módulo lodgings';
    if (code.includes('CONTACT')) return 'Módulo contacts';
    if (code.includes('USER')) return 'Módulo users';
    return 'Dashboard';
  }

  private _timeAgo(timestamp: string): string {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.max(1, Math.floor(diffMs / 60000));

    if (minutes < 60) {
      return `Hace ${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `Hace ${hours} h`;
    }

    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  }
}

import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export const HEALTH_CHECK_GRACE_MS = 30 * 60 * 1000;
const HEALTH_REQUEST_TIMEOUT_MS = 5000;
const HEALTH_RECHECK_INTERVAL_MS = 60 * 1000;
const DEFAULT_MESSAGE = 'Le site est en maintenance. Veuillez réessayer plus tard.';
const AUTO_MESSAGE = 'Le site est temporairement indisponible pendant la remise en ligne du serveur principal.';

export type ManualMaintenanceMode = 'auto' | 'enabled' | 'disabled';

export interface MaintenanceSnapshot {
  is_maintenance: boolean;
  message: string;
  reason: 'available' | 'manual_enabled' | 'manual_disabled' | 'backend_maintenance' | 'backend_unreachable';
  backend_down_since: string | null;
  backend_down_minutes: number;
  manual_mode: ManualMaintenanceMode;
  checked_at: string | null;
  can_admin_bypass: boolean;
}

interface MaintenanceActor {
  id?: number;
  name?: string;
  email?: string;
}

interface MaintenanceState {
  manual_mode: ManualMaintenanceMode;
  manual_message: string | null;
  manual_updated_at: string | null;
  manual_updated_by: MaintenanceActor | null;
  backend_down_since: string | null;
  last_healthy_at: string | null;
  last_checked_at: string | null;
  last_health_status: 'healthy' | 'down' | null;
  last_health_error: string | null;
  backend_maintenance_mode: boolean;
  backend_maintenance_message: string | null;
  cached_snapshot: MaintenanceSnapshot | null;
}

const STATE_DIRECTORY = path.join(process.cwd(), '.runtime');
const STATE_FILE = path.join(STATE_DIRECTORY, 'maintenance-state.json');

function resolveBackendApiBaseUrl() {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const trimmedBaseUrl = rawBaseUrl.replace(/\/+$/, '');
  return trimmedBaseUrl.endsWith('/api') ? trimmedBaseUrl : `${trimmedBaseUrl}/api`;
}

const defaultState = (): MaintenanceState => ({
  manual_mode: 'auto',
  manual_message: null,
  manual_updated_at: null,
  manual_updated_by: null,
  backend_down_since: null,
  last_healthy_at: null,
  last_checked_at: null,
  last_health_status: null,
  last_health_error: null,
  backend_maintenance_mode: false,
  backend_maintenance_message: null,
  cached_snapshot: null,
});

async function ensureStateDirectory() {
  await mkdir(STATE_DIRECTORY, { recursive: true });
}

async function readState(): Promise<MaintenanceState> {
  try {
    const content = await readFile(STATE_FILE, 'utf8');
    return {
      ...defaultState(),
      ...JSON.parse(content),
    } as MaintenanceState;
  } catch {
    return defaultState();
  }
}

async function writeState(state: MaintenanceState) {
  await ensureStateDirectory();
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildSnapshot(state: MaintenanceState): MaintenanceSnapshot {
  const now = Date.now();
  const backendDownSinceMs = state.backend_down_since ? Date.parse(state.backend_down_since) : null;
  const backendDownMinutes = backendDownSinceMs
    ? Math.max(0, Math.floor((now - backendDownSinceMs) / 60000))
    : 0;
  const backendDownLongEnough = backendDownSinceMs !== null && (now - backendDownSinceMs) >= HEALTH_CHECK_GRACE_MS;

  if (state.manual_mode === 'enabled') {
    return {
      is_maintenance: true,
      message: state.manual_message || DEFAULT_MESSAGE,
      reason: 'manual_enabled',
      backend_down_since: state.backend_down_since,
      backend_down_minutes: backendDownMinutes,
      manual_mode: state.manual_mode,
      checked_at: state.last_checked_at,
      can_admin_bypass: true,
    };
  }

  if (state.manual_mode === 'disabled') {
    return {
      is_maintenance: false,
      message: state.manual_message || DEFAULT_MESSAGE,
      reason: 'manual_disabled',
      backend_down_since: state.backend_down_since,
      backend_down_minutes: backendDownMinutes,
      manual_mode: state.manual_mode,
      checked_at: state.last_checked_at,
      can_admin_bypass: true,
    };
  }

  if (state.backend_maintenance_mode) {
    return {
      is_maintenance: true,
      message: state.backend_maintenance_message || DEFAULT_MESSAGE,
      reason: 'backend_maintenance',
      backend_down_since: state.backend_down_since,
      backend_down_minutes: backendDownMinutes,
      manual_mode: state.manual_mode,
      checked_at: state.last_checked_at,
      can_admin_bypass: true,
    };
  }

  if (backendDownLongEnough) {
    return {
      is_maintenance: true,
      message: AUTO_MESSAGE,
      reason: 'backend_unreachable',
      backend_down_since: state.backend_down_since,
      backend_down_minutes: backendDownMinutes,
      manual_mode: state.manual_mode,
      checked_at: state.last_checked_at,
      can_admin_bypass: true,
    };
  }

  return {
    is_maintenance: false,
    message: state.backend_maintenance_message || DEFAULT_MESSAGE,
    reason: 'available',
    backend_down_since: state.backend_down_since,
    backend_down_minutes: backendDownMinutes,
    manual_mode: state.manual_mode,
    checked_at: state.last_checked_at,
    can_admin_bypass: true,
  };
}

export async function getMaintenanceSnapshot(forceRefresh = false): Promise<MaintenanceSnapshot> {
  const state = await readState();
  const now = Date.now();
  const lastCheckedAt = state.last_checked_at ? Date.parse(state.last_checked_at) : null;

  if (
    !forceRefresh
    && state.cached_snapshot
    && lastCheckedAt !== null
    && (now - lastCheckedAt) < HEALTH_RECHECK_INTERVAL_MS
  ) {
    return state.cached_snapshot;
  }

  const backendApiBaseUrl = resolveBackendApiBaseUrl();
  const updatedState: MaintenanceState = {
    ...state,
    last_checked_at: new Date(now).toISOString(),
  };

  try {
    await fetchJson(`${backendApiBaseUrl}/public/health`);

    updatedState.last_health_status = 'healthy';
    updatedState.last_health_error = null;
    updatedState.last_healthy_at = updatedState.last_checked_at;
    updatedState.backend_down_since = null;

    try {
      const maintenancePayload = await fetchJson(`${backendApiBaseUrl}/public/maintenance-status`);
      updatedState.backend_maintenance_mode = Boolean(maintenancePayload?.data?.is_maintenance);
      updatedState.backend_maintenance_message = maintenancePayload?.data?.message || DEFAULT_MESSAGE;
    } catch {
      updatedState.backend_maintenance_mode = false;
      updatedState.backend_maintenance_message = DEFAULT_MESSAGE;
    }
  } catch (error) {
    updatedState.last_health_status = 'down';
    updatedState.last_health_error = error instanceof Error ? error.message : 'health_check_failed';
    updatedState.backend_down_since = updatedState.backend_down_since || updatedState.last_checked_at;
    updatedState.backend_maintenance_mode = false;
  }

  const snapshot = buildSnapshot(updatedState);
  updatedState.cached_snapshot = snapshot;
  await writeState(updatedState);

  return snapshot;
}

export async function updateManualMaintenanceMode(
  mode: ManualMaintenanceMode,
  message?: string | null,
  actor?: MaintenanceActor | null
): Promise<MaintenanceSnapshot> {
  const state = await readState();
  const updatedState: MaintenanceState = {
    ...state,
    manual_mode: mode,
    manual_message: typeof message === 'string'
      ? message.trim() || null
      : state.manual_message,
    manual_updated_at: new Date().toISOString(),
    manual_updated_by: actor ?? state.manual_updated_by,
  };

  const snapshot = buildSnapshot(updatedState);
  updatedState.cached_snapshot = snapshot;
  await writeState(updatedState);

  return snapshot;
}

export function getBackendApiBaseUrlForServer() {
  return resolveBackendApiBaseUrl();
}

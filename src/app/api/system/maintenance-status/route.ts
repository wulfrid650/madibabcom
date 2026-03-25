import { NextRequest, NextResponse } from 'next/server';
import {
  getBackendApiBaseUrlForServer,
  getMaintenanceSnapshot,
  type ManualMaintenanceMode,
  updateManualMaintenanceMode,
} from '@/lib/server/maintenance-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveAdminActor(request: NextRequest) {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    return null;
  }

  const response = await fetch(`${getBackendApiBaseUrlForServer()}/auth/me`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  const user = payload?.data ?? payload;
  const isAdmin = user?.role === 'admin'
    || user?.roles?.some((role: { slug?: string }) => role.slug === 'admin');

  if (!isAdmin) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export async function GET() {
  const snapshot = await getMaintenanceSnapshot();
  return NextResponse.json(snapshot, { status: 200 });
}

export async function POST(request: NextRequest) {
  const actor = await resolveAdminActor(request);

  if (!actor) {
    return NextResponse.json({
      success: false,
      message: 'Accès réservé aux administrateurs.',
    }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const mode = payload?.mode as ManualMaintenanceMode | undefined;
  const message = typeof payload?.message === 'string' ? payload.message : undefined;

  if (!mode || !['auto', 'enabled', 'disabled'].includes(mode)) {
    return NextResponse.json({
      success: false,
      message: 'Mode de maintenance invalide.',
    }, { status: 422 });
  }

  const snapshot = await updateManualMaintenanceMode(mode, message, actor);

  return NextResponse.json({
    success: true,
    data: snapshot,
  });
}

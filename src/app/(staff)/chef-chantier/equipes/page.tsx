'use client';

import { useEffect, useState } from 'react';
import {
    Badge,
    Briefcase,
    Eye,
    Loader2,
    Mail,
    MoreVertical,
    Pencil,
    Phone,
    Plus,
    RefreshCw,
    Save,
    Search,
    ShieldCheck,
    User,
    Users,
    X,
} from 'lucide-react';
import { api, ChefChantierTeam, ChefChantierTeamPayload, PaginationMeta } from '@/lib/api';

type TeamStatus = 'active' | 'inactive';
type TeamForm = {
    name: string;
    leader_name: string;
    specialization: string;
    phone: string;
    email: string;
    members_count: string;
    status: TeamStatus;
};

const emptyForm: TeamForm = {
    name: '',
    leader_name: '',
    specialization: '',
    phone: '',
    email: '',
    members_count: '1',
    status: 'active',
};

const emptyMeta: PaginationMeta = { current_page: 1, last_page: 1, per_page: 10, total: 0 };

const normalizeStatus = (status?: string): TeamStatus => status === 'inactive' ? 'inactive' : 'active';
const statusLabel = (status?: string) => normalizeStatus(status) === 'active' ? 'Actif' : 'Inactif';
const statusClass = (status?: string) => normalizeStatus(status) === 'active'
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800';

const toForm = (team?: ChefChantierTeam): TeamForm => ({
    name: team?.name ?? '',
    leader_name: team?.leader ?? '',
    specialization: team?.specialization ?? '',
    phone: team?.phone ?? '',
    email: team?.email ?? '',
    members_count: String(team?.members ?? 1),
    status: normalizeStatus(team?.status),
});

export default function EquipesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | TeamStatus>('all');
    const [teams, setTeams] = useState<ChefChantierTeam[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [menuId, setMenuId] = useState<number | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<ChefChantierTeam | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formTeam, setFormTeam] = useState<ChefChantierTeam | null>(null);
    const [form, setForm] = useState<TeamForm>(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchTeams = async (withRefresh = false) => {
        if (withRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await api.getChefChantierEquipesPage(searchTerm.trim() || undefined, currentPage);
            setTeams(response.data);
            setMeta(response.meta || emptyMeta);
            setError(null);
            setMenuId(null);
        } catch (fetchError) {
            console.error(fetchError);
            setTeams([]);
            setMeta(emptyMeta);
            setError('Impossible de charger les équipes.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => { void fetchTeams(); }, 250);
        return () => clearTimeout(timer);
    }, [searchTerm, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const filteredTeams = teams.filter((team) => filterStatus === 'all' || normalizeStatus(team.status) === filterStatus);

    const onFormChange = (field: keyof TeamForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const openCreate = () => {
        setFormTeam(null);
        setForm(emptyForm);
        setFormError(null);
        setIsFormOpen(true);
    };

    const openEdit = (team: ChefChantierTeam) => {
        setFormTeam(team);
        setForm(toForm(team));
        setFormError(null);
        setMenuId(null);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        if (submitting) return;
        setIsFormOpen(false);
        setFormTeam(null);
        setForm(emptyForm);
        setFormError(null);
    };

    const closeDetails = () => setSelectedTeam(null);

    const submitForm = async () => {
        if (!form.name.trim() || !form.leader_name.trim()) {
            setFormError('Le nom de l’équipe et le chef d’équipe sont obligatoires.');
            return;
        }

        const members = Number.parseInt(form.members_count, 10);
        const payload: ChefChantierTeamPayload = {
            name: form.name.trim(),
            leader_name: form.leader_name.trim(),
            specialization: form.specialization.trim() || undefined,
            phone: form.phone.trim() || undefined,
            email: form.email.trim() || undefined,
            members_count: Number.isNaN(members) ? 1 : Math.max(1, members),
            status: form.status,
        };

        setSubmitting(true);
        setFormError(null);
        try {
            const response = formTeam
                ? await api.updateChefChantierEquipe(formTeam.id, payload)
                : await api.createChefChantierEquipe(payload);

            if (!response.success) {
                setFormError(response.message || 'Impossible d’enregistrer cette équipe.');
                return;
            }

            closeForm();
            await fetchTeams();
        } catch (submitError) {
            console.error(submitError);
            setFormError('Impossible d’enregistrer cette équipe.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (team: ChefChantierTeam) => {
        try {
            const nextStatus: TeamStatus = normalizeStatus(team.status) === 'active' ? 'inactive' : 'active';
            const response = await api.updateChefChantierEquipe(team.id, { status: nextStatus });
            if (!response.success) {
                setError(response.message || 'Impossible de mettre à jour le statut.');
                return;
            }
            if (selectedTeam?.id === team.id) setSelectedTeam({ ...selectedTeam, status: nextStatus });
            await fetchTeams();
        } catch (statusError) {
            console.error(statusError);
            setError('Impossible de mettre à jour le statut.');
        } finally {
            setMenuId(null);
        }
    };

    const start = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
    const end = meta.total === 0 ? 0 : Math.min(meta.current_page * meta.per_page, meta.total);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Équipes</h1>
                    <p className="mt-1 text-gray-600">{filteredTeams.length} équipe(s) affichée(s) sur cette page</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => void fetchTeams(true)} disabled={loading || refreshing} className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                    <button onClick={openCreate} className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvelle équipe
                    </button>
                </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Rechercher par nom, chef d'équipe ou spécialité..." className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as 'all' | TeamStatus)} className="rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500">
                        <option value="all">Tous les statuts</option>
                        <option value="active">Actifs</option>
                        <option value="inactive">Inactifs</option>
                    </select>
                </div>
            </div>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

            {loading ? (
                <div className="flex h-64 items-center justify-center rounded-lg bg-white shadow">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                </div>
            ) : filteredTeams.length === 0 ? (
                <div className="rounded-lg bg-white py-16 text-center shadow">
                    <p className="text-lg text-gray-600">Aucune équipe trouvée.</p>
                    <p className="mt-2 text-sm text-gray-500">Ajuste la recherche ou crée une nouvelle équipe.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {filteredTeams.map((team) => (
                            <div key={team.id} className="rounded-lg bg-white shadow transition-shadow hover:shadow-lg">
                                <div className="p-6">
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">{team.specialization || 'Non précisée'}</span>
                                            </div>
                                        </div>
                                        <div className="relative flex items-center gap-2">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(team.status)}`}>{statusLabel(team.status)}</span>
                                            <button onClick={() => setMenuId((prev) => prev === team.id ? null : team.id)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                            {menuId === team.id && (
                                                <div className="absolute right-0 top-12 z-10 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                                                    <button onClick={() => setSelectedTeam(team)} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Eye className="mr-2 h-4 w-4" />Voir équipe</button>
                                                    <button onClick={() => openEdit(team)} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Pencil className="mr-2 h-4 w-4" />Éditer</button>
                                                    <button onClick={() => void toggleStatus(team)} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><ShieldCheck className="mr-2 h-4 w-4" />{normalizeStatus(team.status) === 'active' ? 'Désactiver' : 'Activer'}</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4 rounded-lg bg-gray-50 p-4">
                                        <p className="mb-2 text-xs text-gray-500">Chef d'équipe</p>
                                        <p className="font-semibold text-gray-900">{team.leader}</p>
                                    </div>

                                    <div className="mb-4 space-y-2">
                                        <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-gray-400" /><span className="text-gray-600">{team.phone || 'Non renseigné'}</span></div>
                                        <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-gray-400" /><span className="text-gray-600">{team.email || 'Non renseigné'}</span></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                                        <div><p className="mb-1 text-xs text-gray-500">Membres</p><p className="text-2xl font-bold text-gray-900">{team.members}</p></div>
                                        <div><p className="mb-1 text-xs text-gray-500">Chantiers</p><p className="text-2xl font-bold text-amber-600">{team.projects}</p></div>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <button onClick={() => setSelectedTeam(team)} className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">Voir équipe</button>
                                        <button onClick={() => openEdit(team)} className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200">Éditer</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-4 rounded-lg bg-white px-6 py-4 shadow md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-gray-600">Affichage de {start} à {end} sur {meta.total} équipe(s)</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={meta.current_page <= 1} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Précédent</button>
                            <span className="px-3 text-sm text-gray-600">Page {meta.current_page} / {meta.last_page}</span>
                            <button onClick={() => setCurrentPage((prev) => Math.min(meta.last_page, prev + 1))} disabled={meta.current_page >= meta.last_page} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Suivant</button>
                        </div>
                    </div>
                </>
            )}

            {selectedTeam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <div><h2 className="text-xl font-semibold text-gray-900">{selectedTeam.name}</h2><p className="mt-1 text-sm text-gray-500">Fiche détaillée de l’équipe</p></div>
                            <button onClick={closeDetails} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
                            <div className="rounded-xl bg-gray-50 p-4"><div className="flex items-center gap-2 text-sm font-medium text-gray-500"><User className="h-4 w-4" />Chef d’équipe</div><p className="mt-2 text-lg font-semibold text-gray-900">{selectedTeam.leader}</p></div>
                            <div className="rounded-xl bg-gray-50 p-4"><div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Briefcase className="h-4 w-4" />Spécialité</div><p className="mt-2 text-lg font-semibold text-gray-900">{selectedTeam.specialization || 'Non précisée'}</p></div>
                            <div className="rounded-xl bg-gray-50 p-4"><div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Phone className="h-4 w-4" />Téléphone</div><p className="mt-2 text-lg font-semibold text-gray-900">{selectedTeam.phone || 'Non renseigné'}</p></div>
                            <div className="rounded-xl bg-gray-50 p-4"><div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Mail className="h-4 w-4" />Email</div><p className="mt-2 text-lg font-semibold text-gray-900">{selectedTeam.email || 'Non renseigné'}</p></div>
                            <div className="rounded-xl bg-gray-50 p-4"><div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Users className="h-4 w-4" />Membres</div><p className="mt-2 text-lg font-semibold text-gray-900">{selectedTeam.members}</p></div>
                            <div className="rounded-xl bg-gray-50 p-4"><div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Briefcase className="h-4 w-4" />Chantiers actifs</div><p className="mt-2 text-lg font-semibold text-gray-900">{selectedTeam.projects}</p></div>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClass(selectedTeam.status)}`}>{statusLabel(selectedTeam.status)}</span>
                            <div className="flex gap-3">
                                <button onClick={() => void toggleStatus(selectedTeam)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{normalizeStatus(selectedTeam.status) === 'active' ? 'Désactiver' : 'Activer'}</button>
                                <button onClick={() => { const team = selectedTeam; closeDetails(); openEdit(team); }} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">Éditer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{formTeam ? 'Modifier l’équipe' : 'Nouvelle équipe'}</h2>
                                <p className="mt-1 text-sm text-gray-500">{formTeam ? 'Mets à jour les informations de l’équipe.' : 'Crée une nouvelle équipe de chantier.'}</p>
                            </div>
                            <button onClick={closeForm} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-5 px-6 py-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div><label className="mb-2 block text-sm font-medium text-gray-700">Nom de l’équipe</label><input value={form.name} onChange={(event) => onFormChange('name', event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500" /></div>
                                <div><label className="mb-2 block text-sm font-medium text-gray-700">Chef d’équipe</label><input value={form.leader_name} onChange={(event) => onFormChange('leader_name', event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500" /></div>
                                <div><label className="mb-2 block text-sm font-medium text-gray-700">Spécialité</label><input value={form.specialization} onChange={(event) => onFormChange('specialization', event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500" /></div>
                                <div><label className="mb-2 block text-sm font-medium text-gray-700">Nombre de membres</label><input type="number" min="1" value={form.members_count} onChange={(event) => onFormChange('members_count', event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500" /></div>
                                <div><label className="mb-2 block text-sm font-medium text-gray-700">Téléphone</label><input value={form.phone} onChange={(event) => onFormChange('phone', event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500" /></div>
                                <div><label className="mb-2 block text-sm font-medium text-gray-700">Email</label><input type="email" value={form.email} onChange={(event) => onFormChange('email', event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500" /></div>
                            </div>
                            {formTeam && (
                                <div><label className="mb-2 block text-sm font-medium text-gray-700">Statut</label><select value={form.status} onChange={(event) => onFormChange('status', event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500"><option value="active">Actif</option><option value="inactive">Inactif</option></select></div>
                            )}
                            {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                            <button onClick={closeForm} disabled={submitting} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">Annuler</button>
                            <button onClick={() => void submitForm()} disabled={submitting} className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60">
                                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {submitting ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

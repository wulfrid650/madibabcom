'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket, Plus, Edit, Trash2, Search, Calendar, TrendingUp, Users, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getSecretairePromoCodes, createPromoCode as createPromoCodeApi, updatePromoCode, deletePromoCode as deletePromoCodeApi } from '@/lib/api';

interface PromoCode {
    id: number;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    max_uses: number | null;
    used_count: number;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
    description: string | null;
    formations: number[] | null;
    created_at: string;
}

export default function PromoCodesPage() {
    const { token } = useAuth();
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage' as 'percentage' | 'fixed',
        value: 0,
        max_uses: null as number | null,
        valid_from: '',
        valid_until: '',
        description: '',
    });

    useEffect(() => {
        if (token) {
            fetchPromoCodes();
        }
    }, [token]);

    const fetchPromoCodes = async () => {
        try {
            const response = await getSecretairePromoCodes();
            if (response.success) {
                setPromoCodes(response.data.data || response.data || []);
            }
        } catch (err) {
            console.error('Error fetching promo codes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCode) {
                await updatePromoCode(editingCode.id, formData);
            } else {
                await createPromoCodeApi(formData);
            }
            setShowModal(false);
            resetForm();
            fetchPromoCodes();
        } catch (err) {
            console.error('Error saving promo code:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce code promo?')) return;

        try {
            await deletePromoCodeApi(id);
            fetchPromoCodes();
        } catch (err) {
            console.error('Error deleting promo code:', err);
        }
    };

    const handleEdit = (code: PromoCode) => {
        setEditingCode(code);
        setFormData({
            code: code.code,
            type: code.type,
            value: code.value,
            max_uses: code.max_uses,
            valid_from: code.valid_from || '',
            valid_until: code.valid_until || '',
            description: code.description || '',
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            type: 'percentage',
            value: 0,
            max_uses: null,
            valid_from: '',
            valid_until: '',
            description: '',
        });
        setEditingCode(null);
    };

    const filteredCodes = promoCodes.filter(code => {
        const matchSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            code.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchActive = filterActive === 'all' ||
            (filterActive === 'active' && code.is_active) ||
            (filterActive === 'inactive' && !code.is_active);
        return matchSearch && matchActive;
    });

    const stats = {
        total: promoCodes.length,
        active: promoCodes.filter(c => c.is_active).length,
        totalUsage: promoCodes.reduce((sum, c) => sum + c.used_count, 0),
        avgUsage: promoCodes.length > 0
            ? Math.round(promoCodes.reduce((sum, c) => sum + c.used_count, 0) / promoCodes.length)
            : 0,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-madiba-red"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-madiba-black dark:text-white flex items-center gap-3">
                        <Ticket className="h-8 w-8 text-madiba-red" />
                        Codes Promo
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Gérez les codes de réduction pour les formations
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="bg-madiba-red hover:bg-red-700"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Nouveau Code
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <Ticket className="h-8 w-8 text-madiba-red" />
                        <div>
                            <p className="text-sm text-gray-500">Total Codes</p>
                            <p className="text-2xl font-bold text-madiba-black dark:text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <div>
                            <p className="text-sm text-gray-500">Codes Actifs</p>
                            <p className="text-2xl font-bold text-madiba-black dark:text-white">{stats.active}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-500" />
                        <div>
                            <p className="text-sm text-gray-500">Total Utilisations</p>
                            <p className="text-2xl font-bold text-madiba-black dark:text-white">{stats.totalUsage}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-purple-500" />
                        <div>
                            <p className="text-sm text-gray-500">Moyenne Utilisation</p>
                            <p className="text-2xl font-bold text-madiba-black dark:text-white">{stats.avgUsage}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-madiba-black dark:text-white focus:ring-2 focus:ring-madiba-red"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterActive('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterActive === 'all'
                                ? 'bg-madiba-red text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            Tous
                        </button>
                        <button
                            onClick={() => setFilterActive('active')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterActive === 'active'
                                ? 'bg-madiba-red text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            Actifs
                        </button>
                        <button
                            onClick={() => setFilterActive('inactive')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterActive === 'inactive'
                                ? 'bg-madiba-red text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            Inactifs
                        </button>
                    </div>
                </div>
            </div>

            {/* Codes List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Code</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Type</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Valeur</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Utilisations</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Validité</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Statut</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCodes.map((code) => (
                                <tr key={code.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="py-4 px-4">
                                        <div>
                                            <p className="font-semibold text-madiba-black dark:text-white">{code.code}</p>
                                            {code.description && (
                                                <p className="text-sm text-gray-500">{code.description}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${code.type === 'percentage'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                            }`}>
                                            {code.type === 'percentage' ? 'Pourcentage' : 'Montant Fixe'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="font-bold text-madiba-red">
                                            {code.type === 'percentage' ? `${code.value}%` : `${code.value} FCFA`}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-madiba-red rounded-full"
                                                        style={{
                                                            width: code.max_uses
                                                                ? `${Math.min((code.used_count / code.max_uses) * 100, 100)}%`
                                                                : '0%'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {code.used_count}/{code.max_uses || '∞'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-sm">
                                            {code.valid_from && (
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    Du {new Date(code.valid_from).toLocaleDateString('fr-FR')}
                                                </p>
                                            )}
                                            {code.valid_until && (
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    Au {new Date(code.valid_until).toLocaleDateString('fr-FR')}
                                                </p>
                                            )}
                                            {!code.valid_from && !code.valid_until && (
                                                <p className="text-gray-400">Illimitée</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${code.is_active
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                            }`}>
                                            {code.is_active ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(code)}
                                                className="p-2 text-gray-500 hover:text-madiba-red hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(code.id)}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredCodes.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun code promo trouvé</p>
                    </div>
                )}
            </div>

            {/* Modal Create/Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-madiba-black dark:text-white">
                                {editingCode ? 'Modifier le Code Promo' : 'Nouveau Code Promo'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-madiba-black dark:text-white"
                                    placeholder="Ex: PROMO2026"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Type *
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-madiba-black dark:text-white"
                                    >
                                        <option value="percentage">Pourcentage</option>
                                        <option value="fixed">Montant Fixe</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Valeur * {formData.type === 'percentage' ? '(%)' : '(FCFA)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-madiba-black dark:text-white"
                                        min="0"
                                        step={formData.type === 'percentage' ? '1' : '100'}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Utilisations Maximum (vide = illimité)
                                </label>
                                <input
                                    type="number"
                                    value={formData.max_uses || ''}
                                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-madiba-black dark:text-white"
                                    min="1"
                                    placeholder="Illimité"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Valide du
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.valid_from}
                                        onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-madiba-black dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Valide jusqu'au
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.valid_until}
                                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-madiba-black dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-madiba-black dark:text-white"
                                    rows={3}
                                    placeholder="Description du code promo..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-madiba-red hover:bg-red-700"
                                >
                                    {editingCode ? 'Mettre à jour' : 'Créer'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

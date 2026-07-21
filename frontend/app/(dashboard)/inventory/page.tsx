'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, Edit, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import apiClient from '@/services/api';
import { FOOD_CATEGORIES, STATUS_COLORS } from '@/lib/constants';

interface FoodItem {
  id: number;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  expiryDate: string;
  storageLocation: string;
  status: 'fresh' | 'expiring' | 'expired';
  notes?: string;
}

function InventoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(action === 'add');
  const [showDonateForm, setShowDonateForm] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);

  const [formData, setFormData] = useState({
    foodName: '',
    category: '',
    quantity: '',
    unit: 'kg',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    storageLocation: 'Refrigerator',
    notes: '',
  });

  const [donationData, setDonationData] = useState({
    pickupLocation: 'Refrigerator',
    availableUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
  });

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      if (searchQuery) params.append('search', searchQuery);

      const response = await apiClient.get(`/inventory?${params}`);
      setItems(response.data.data ?? []);
      setTotal(response.data.pagination?.total ?? 0);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setError('Unable to load your inventory. Please sign in again and try once more.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, searchQuery]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const quantity = Number(formData.quantity);

      if (!formData.foodName.trim() || !formData.category.trim() || !formData.quantity.trim() || !formData.expiryDate.trim()) {
        setError('Please fill in all required fields before saving.');
        return;
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError('Please enter a quantity greater than zero.');
        return;
      }

      const purchaseDate = new Date(formData.purchaseDate);
      const expiryDate = new Date(formData.expiryDate);

      if (Number.isNaN(purchaseDate.getTime()) || Number.isNaN(expiryDate.getTime())) {
        setError('Please enter valid purchase and expiry dates.');
        return;
      }

      await apiClient.post('/inventory', {
        ...formData,
        quantity,
        purchaseDate: purchaseDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
      });
      setFormData({
        foodName: '',
        category: '',
        quantity: '',
        unit: 'kg',
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        storageLocation: 'Refrigerator',
        notes: '',
      });
      setShowAddForm(false);
      await fetchItems();
    } catch (error) {
      console.error('Failed to add item:', error);
      const responseData = (error as {
        response?: { data?: { message?: string; errors?: Array<{ message?: string }> } };
      }).response?.data;
      const message = responseData?.errors?.[0]?.message || responseData?.message;
      setError(message || 'Unable to save this item. Please try again.');
    }
  };

  const handleDelete = async (itemId: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await apiClient.delete(`/inventory/${itemId}`);
        fetchItems();
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  const handleDonateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFoodItem) return;

    setError('');
    try {
      const availableUntil = new Date(donationData.availableUntil);
      if (Number.isNaN(availableUntil.getTime())) {
        setError('Please select a valid donation end date.');
        return;
      }

      await apiClient.post('/donations', {
        foodInventoryId: selectedFoodItem.id,
        pickupLocation: donationData.pickupLocation,
        availableUntil: availableUntil.toISOString(),
        description: donationData.description,
      });

      setShowDonateForm(false);
      setSelectedFoodItem(null);
      setDonationData({
        pickupLocation: 'Refrigerator',
        availableUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '',
      });
      await fetchItems();
    } catch (error) {
      console.error('Failed to create donation:', error);
      const responseData = (error as {
        response?: { data?: { message?: string; errors?: Array<{ message?: string }> } };
      }).response?.data;
      const message = responseData?.errors?.[0]?.message || responseData?.message;
      setError(message || 'Unable to create donation. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'expired') return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (status === 'expiring') return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Food Inventory"
        description="Manage your food inventory and track expiry dates"
      />

      <main className="flex-1 p-6 overflow-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        {error && (
          <div role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {/* Search and Filters */}
        <div className="mb-6 flex gap-4 flex-col sm:flex-row">
          <input
            type="text"
            placeholder="Search food items..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Categories</option>
            {FOOD_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Item
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-6 p-6 bg-card border border-border rounded-lg">
            <h2 className="text-lg font-semibold text-foreground mb-4">Add New Food Item</h2>
            <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Food name"
                value={formData.foodName}
                onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select category</option>
                {FOOD_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="l">l</option>
                <option value="ml">ml</option>
                <option value="pieces">pieces</option>
              </select>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <input
                type="date"
                placeholder="Expiry date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <select
                value={formData.storageLocation}
                onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Refrigerator">Refrigerator</option>
                <option value="Freezer">Freezer</option>
                <option value="Pantry">Pantry</option>
                <option value="Countertop">Countertop</option>
              </select>
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:col-span-2"
                rows={3}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors sm:col-span-2"
              >
                Add Item
              </button>
            </form>
          </div>
        )}

        {/* Items Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Food Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Quantity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                      No items found. Add your first item!
                    </td>
                  </tr>
                ) : (
                  items.map(item => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted transition-colors">
                      <td className="px-6 py-4 text-sm text-foreground font-medium">{item.foodName}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.category}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.quantity} {item.unit}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className="text-sm font-medium capitalize">{item.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/inventory/${item.id}/edit`)}
                            className="p-2 hover:bg-muted rounded transition-colors"
                          >
                            <Edit className="h-4 w-4 text-primary" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFoodItem(item);
                              setShowDonateForm(true);
                              setDonationData(prev => ({
                                ...prev,
                                description: item.notes || '',
                              }));
                            }}
                            className="px-3 py-2 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Donate
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 hover:bg-muted rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showDonateForm && selectedFoodItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Donate {selectedFoodItem.foodName}</h2>
              <p className="text-sm text-muted-foreground mb-4">List this item for donation using your real inventory data.</p>
              <form onSubmit={handleDonateItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  value={donationData.pickupLocation}
                  onChange={(e) => setDonationData({ ...donationData, pickupLocation: e.target.value })}
                  className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:col-span-2"
                >
                  <option value="Refrigerator">Refrigerator</option>
                  <option value="Freezer">Freezer</option>
                  <option value="Pantry">Pantry</option>
                  <option value="Countertop">Countertop</option>
                  <option value="Basement">Basement</option>
                </select>

                <input
                  type="date"
                  value={donationData.availableUntil}
                  onChange={(e) => setDonationData({ ...donationData, availableUntil: e.target.value })}
                  className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:col-span-2"
                  required
                />

                <textarea
                  placeholder="Optional description"
                  value={donationData.description}
                  onChange={(e) => setDonationData({ ...donationData, description: e.target.value })}
                  className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:col-span-2"
                  rows={3}
                />

                <div className="sm:col-span-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDonateForm(false);
                      setSelectedFoodItem(null);
                    }}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    List for Donation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} items
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= total}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<main className="flex-1 p-6">Loading...</main>}>
      <InventoryPageContent />
    </Suspense>
  );
}

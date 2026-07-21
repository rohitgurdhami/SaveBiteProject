'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import apiClient from '@/services/api';
import { FOOD_CATEGORIES, STORAGE_LOCATIONS, UNITS } from '@/lib/constants';
import type { FoodInventoryItem } from '@/types';

type InventoryFormMode = 'add' | 'edit';

type InventoryFormData = {
  foodName: string;
  category: string;
  quantity: string;
  unit: string;
  purchaseDate: string;
  expiryDate: string;
  storageLocation: string;
  notes: string;
};

const blankForm = (): InventoryFormData => ({
  foodName: '',
  category: '',
  quantity: '',
  unit: 'kg',
  purchaseDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
  storageLocation: 'Refrigerator',
  notes: '',
});

const toDateInputValue = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.split('T')[0] : date.toISOString().split('T')[0];
};

const formFromItem = (item: FoodInventoryItem): InventoryFormData => ({
  foodName: item.foodName,
  category: item.category,
  quantity: String(item.quantity),
  unit: item.unit,
  purchaseDate: toDateInputValue(item.purchaseDate),
  expiryDate: toDateInputValue(item.expiryDate),
  storageLocation: item.storageLocation,
  notes: item.notes ?? '',
});

export function InventoryItemForm({ mode, itemId }: { mode: InventoryFormMode; itemId?: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState<InventoryFormData>(blankForm);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !itemId) return;

    const fetchItem = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.get(`/inventory/${itemId}`);
        setFormData(formFromItem(response.data.data));
      } catch (error) {
        console.error('Failed to fetch inventory item:', error);
        setError('Unable to load this inventory item.');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId, mode]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

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

    setSaving(true);
    try {
      const payload = {
        ...formData,
        quantity,
        purchaseDate: purchaseDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
      };

      if (mode === 'edit' && itemId) {
        await apiClient.put(`/inventory/${itemId}`, payload);
      } else {
        await apiClient.post('/inventory', payload);
      }

      router.push('/inventory');
      router.refresh();
    } catch (error) {
      console.error('Failed to save inventory item:', error);
      const responseData = (error as {
        response?: { data?: { message?: string; errors?: Array<{ message?: string }> } };
      }).response?.data;
      const message = responseData?.errors?.[0]?.message || responseData?.message;
      setError(message || 'Unable to save this item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading item...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl rounded-lg border border-border bg-card p-6">
      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Food name
          <input
            type="text"
            value={formData.foodName}
            onChange={(event) => setFormData({ ...formData, foodName: event.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Category
          <select
            value={formData.category}
            onChange={(event) => setFormData({ ...formData, category: event.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select category</option>
            {FOOD_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-foreground">
          Quantity
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={formData.quantity}
            onChange={(event) => setFormData({ ...formData, quantity: event.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Unit
          <select
            value={formData.unit}
            onChange={(event) => setFormData({ ...formData, unit: event.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-foreground">
          Purchase date
          <input
            type="date"
            value={formData.purchaseDate}
            onChange={(event) => setFormData({ ...formData, purchaseDate: event.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Expiry date
          <input
            type="date"
            value={formData.expiryDate}
            onChange={(event) => setFormData({ ...formData, expiryDate: event.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Storage location
          <select
            value={formData.storageLocation}
            onChange={(event) => setFormData({ ...formData, storageLocation: event.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {STORAGE_LOCATIONS.map((location) => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-foreground sm:col-span-2">
          Notes
          <textarea
            value={formData.notes}
            onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4}
          />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push('/inventory')}
          className="rounded-lg border border-border px-4 py-2 font-medium text-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : mode === 'edit' ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, Clock3, Edit3, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import apiClient from '@/services/api';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface InventoryItem {
  id: number;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  storageLocation: string;
}

interface MealIngredient {
  inventoryItemId: number;
  foodName: string;
  quantityUsed: number;
  unit: string;
}

interface MealItem {
  id: number;
  day: string;
  mealType: MealType;
  foodName: string;
  notes?: string;
  scheduledAt?: string;
  status?: 'planned' | 'completed';
  completedAt?: string;
  ingredientItems?: MealIngredient[];
}

interface MealPlan {
  id: number;
  title?: string;
  weekStartDate: string;
  meals: MealItem[];
}

interface MealSuggestion {
  inventoryItemId: number;
  foodName: string;
  category: string;
  expiryDate: string;
  storageLocation: string;
  reason: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const getMonday = (date: Date) => {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

const getResponseData = <T,>(result: PromiseSettledResult<{ data: { data: T } }>, fallback: T) => {
  if (result.status === 'fulfilled') {
    return result.value.data.data ?? fallback;
  }

  console.error('Meal planner request failed', result.reason);
  return fallback;
};

export default function MealPlannerPage() {
  const router = useRouter();
  const [weekStartDate, setWeekStartDate] = useState(() => formatDateInput(getMonday(new Date())));
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [history, setHistory] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [editingMealId, setEditingMealId] = useState<number | null>(null);
  const [mealDraft, setMealDraft] = useState({
    day: 'Monday',
    mealType: 'breakfast' as MealType,
    foodName: '',
    notes: '',
    scheduledAt: '',
    ingredientItems: [] as MealIngredient[],
  });
  const [planTitle, setPlanTitle] = useState('');

  const groupedMeals = useMemo(() => {
    const byDay: Record<string, MealItem[]> = {};
    DAYS.forEach((day) => {
      byDay[day] = [];
    });
    mealPlan?.meals?.forEach((meal) => {
      byDay[meal.day]?.push(meal);
    });
    return byDay;
  }, [mealPlan]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [planResponse, inventoryResponse, suggestionsResponse, historyResponse] = await Promise.allSettled([
        apiClient.get(`/meal-plans?weekStartDate=${weekStartDate}`),
        apiClient.get('/inventory?pageSize=1000'),
        apiClient.get('/meal-plans/suggestions'),
        apiClient.get('/meal-plans/history'),
      ]);

      const planData = getResponseData<MealPlan | null>(planResponse, null);
      setMealPlan({
        id: planData?.id ?? 0,
        title: planData?.title,
        weekStartDate: planData?.weekStartDate ?? weekStartDate,
        meals: Array.isArray(planData?.meals) ? planData.meals.filter(Boolean) : [],
      });
      setPlanTitle(planData?.title ?? `Week of ${weekStartDate}`);
      setInventory(getResponseData<{ items?: InventoryItem[] }>(inventoryResponse, {}).items ?? []);
      setSuggestions(getResponseData<MealSuggestion[]>(suggestionsResponse, []));
      setHistory(getResponseData<MealItem[]>(historyResponse, []));
    } catch (error) {
      console.error('Failed to load meal planner', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [weekStartDate]);

  const resetMealDraft = () => {
    setMealDraft({
      day: 'Monday',
      mealType: 'breakfast',
      foodName: '',
      notes: '',
      scheduledAt: '',
      ingredientItems: [],
    });
    setEditingMealId(null);
  };

  const savePlan = async () => {
    try {
      setSaving(true);
      if (mealPlan?.id) {
        await apiClient.put(`/meal-plans/${mealPlan.id}`, {
          title: planTitle,
          weekStartDate,
        });
      } else {
        await apiClient.post('/meal-plans', {
          title: planTitle,
          weekStartDate,
        });
      }
      await fetchData();
      setShowCreatePlan(false);
    } finally {
      setSaving(false);
    }
  };

  const addOrUpdateMeal = async () => {
    if (!mealDraft.foodName.trim()) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        weekStartDate,
        ...mealDraft,
      };

      if (editingMealId) {
        await apiClient.put(`/meal-plans/meal-items/${editingMealId}`, payload);
      } else {
        await apiClient.post('/meal-plans/add-meal', payload);
      }

      resetMealDraft();
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const removeMeal = async (mealId: number) => {
    await apiClient.delete(`/meal-plans/meal-items/${mealId}`);
    await fetchData();
  };

  const completeMeal = async (mealId: number) => {
    await apiClient.post(`/meal-plans/meal-items/${mealId}/complete`);
    await fetchData();
  };

  const editMeal = (meal: MealItem) => {
    setEditingMealId(meal.id);
    setMealDraft({
      day: meal.day,
      mealType: meal.mealType,
      foodName: meal.foodName,
      notes: meal.notes ?? '',
      scheduledAt: meal.scheduledAt ?? '',
      ingredientItems: meal.ingredientItems ?? [],
    });
  };

  const addIngredient = (item: InventoryItem) => {
    setMealDraft((current) => ({
      ...current,
      ingredientItems: [
        ...current.ingredientItems,
        {
          inventoryItemId: item.id,
          foodName: item.foodName,
          quantityUsed: 1,
          unit: item.unit,
        },
      ],
      foodName: current.foodName || item.foodName,
    }));
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Meal Planner" description="Plan weekly meals, use up expiring food, and track what gets eaten." />

      <main className="flex-1 p-6 overflow-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Week planner</p>
                <h2 className="text-xl font-semibold text-foreground">{mealPlan?.title ?? 'New meal plan'}</h2>
                <p className="text-sm text-muted-foreground">Use inventory first, then lock in the weekly schedule.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setWeekStartDate(formatDateInput(getMonday(new Date(new Date(weekStartDate).getTime() - 7 * 86400000))))} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">Previous</button>
                <button onClick={() => setWeekStartDate(formatDateInput(getMonday(new Date())))} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">Today</button>
                <button onClick={() => setWeekStartDate(formatDateInput(getMonday(new Date(new Date(weekStartDate).getTime() + 7 * 86400000))))} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">Next</button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground">
                <span className="block text-xs text-muted-foreground">Week start</span>
                {weekStartDate}
              </div>
              <div className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground">
                <span className="block text-xs text-muted-foreground">Meals planned</span>
                {mealPlan?.meals?.length ?? 0}
              </div>
              <div className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground">
                <span className="block text-xs text-muted-foreground">Expiring suggestions</span>
                {suggestions.length}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <input value={planTitle} onChange={(event) => setPlanTitle(event.target.value)} placeholder="Meal plan title" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={savePlan} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                Save
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Expiry-first suggestions</h3>
            <div className="mt-3 space-y-2">
              {suggestions.slice(0, 5).map((item) => (
                <button key={item.inventoryItemId} onClick={() => {
                  const inventoryItem = inventory.find((currentItem) => currentItem.id === item.inventoryItemId);
                  if (inventoryItem) {
                    addIngredient(inventoryItem);
                  }
                }} className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-left hover:bg-muted">
                  <div>
                    <p className="font-medium text-foreground">{item.foodName}</p>
                    <p className="text-xs text-muted-foreground">{item.category} · {item.storageLocation}</p>
                  </div>
                  <span className="text-xs text-primary">{item.reason}</span>
                </button>
              ))}
              {!suggestions.length && <p className="text-sm text-muted-foreground">No expiring items right now.</p>}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Weekly schedule</h3>
              <button onClick={() => setShowCreatePlan(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                <Plus className="h-4 w-4" />
                Add meal
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading meal plan...</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
                {DAYS.map((day) => (
                  <div key={day} className="rounded-2xl border border-border bg-background p-3">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      {day}
                    </h4>
                    <div className="space-y-3">
                      {MEAL_TYPES.map((mealType) => {
                        const meals = groupedMeals[day]?.filter((meal) => meal.mealType === mealType) ?? [];
                        return (
                          <div key={`${day}-${mealType}`} className="rounded-xl bg-muted/60 p-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{mealType}</p>
                            <div className="mt-2 space-y-2">
                              {meals.map((meal) => (
                                <div key={meal.id} className="rounded-lg border border-border bg-card p-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{meal.foodName}</p>
                                      <p className="text-xs text-muted-foreground">{meal.notes || 'No notes'}</p>
                                    </div>
                                    <div className="flex gap-1">
                                      <button onClick={() => editMeal(meal)} className="rounded p-1 hover:bg-muted"><Edit3 className="h-3.5 w-3.5" /></button>
                                      <button onClick={() => completeMeal(meal.id)} className="rounded p-1 hover:bg-muted"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /></button>
                                      <button onClick={() => removeMeal(meal.id)} className="rounded p-1 hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-red-600" /></button>
                                    </div>
                                  </div>
                                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                                    <Clock3 className="h-3 w-3" />
                                    {meal.status === 'completed' ? 'Completed' : 'Planned'}
                                  </div>
                                </div>
                              ))}
                              {!meals.length && <p className="text-xs text-muted-foreground">No meal yet.</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">{editingMealId ? 'Edit meal' : 'Add meal'}</h3>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select value={mealDraft.day} onChange={(event) => setMealDraft((current) => ({ ...current, day: event.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    {DAYS.map((day) => <option key={day}>{day}</option>)}
                  </select>
                  <select value={mealDraft.mealType} onChange={(event) => setMealDraft((current) => ({ ...current, mealType: event.target.value as MealType }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    {MEAL_TYPES.map((mealType) => <option key={mealType}>{mealType}</option>)}
                  </select>
                </div>
                <input value={mealDraft.foodName} onChange={(event) => setMealDraft((current) => ({ ...current, foodName: event.target.value }))} placeholder="Meal name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input value={mealDraft.scheduledAt} onChange={(event) => setMealDraft((current) => ({ ...current, scheduledAt: event.target.value }))} type="datetime-local" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <textarea value={mealDraft.notes} onChange={(event) => setMealDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <button onClick={addOrUpdateMeal} disabled={saving} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
                  {editingMealId ? 'Update meal' : 'Save meal'}
                </button>
                {editingMealId && <button onClick={resetMealDraft} className="w-full rounded-lg border border-border px-4 py-2 text-sm">Cancel edit</button>}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">Inventory picker</h3>
              <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
                {inventory.slice(0, 12).map((item) => (
                  <button key={item.id} onClick={() => addIngredient(item)} className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-left hover:bg-muted">
                    <div>
                      <p className="font-medium text-foreground">{item.foodName}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} · expires {new Date(item.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                ))}
              </div>
              {!!mealDraft.ingredientItems.length && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">Selected ingredients</p>
                  {mealDraft.ingredientItems.map((ingredient) => (
                    <div key={ingredient.inventoryItemId} className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
                      {ingredient.foodName}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">Meal history</h3>
              <div className="mt-3 space-y-2">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-xl border border-border px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{item.foodName}</p>
                    <p className="text-xs text-muted-foreground">{item.day} · {item.status ?? 'planned'}</p>
                  </div>
                ))}
                {!history.length && <p className="text-sm text-muted-foreground">No completed meals yet.</p>}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

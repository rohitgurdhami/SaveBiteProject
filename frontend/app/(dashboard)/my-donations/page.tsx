'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Check, X, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import apiClient from '@/services/api';

interface DonationRequest {
  id: number;
  foodName: string;
  recipientName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  message?: string;
}

export default function MyDonationsPage() {
  const router = useRouter();
  const [donations, setDonations] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/donations/my-donations?page=${page}&pageSize=${pageSize}`);
      setDonations(response.data.data ?? []);
      setTotal(response.data.pagination?.total ?? 0);
    } catch (error) {
      console.error('Failed to fetch donations:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDonations();
  }, [page]);

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await apiClient.patch(`/donation-requests/${requestId}/accept`);
      fetchDonations();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };
  const handleRejectRequest = async (requestId: number) => {
    try {
      await apiClient.patch(`/donation-requests/${requestId}/reject`);
      fetchDonations();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800' },
    };
    const badge = badges[status] || badges.pending;
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>{status}</span>;
  };
  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="My Donations"
        description="Manage your food donations and requests"
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

        {/* Donations List */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Food Item</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Recipient</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : donations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                      No donations yet. Create one from your inventory!
                    </td>
                  </tr>
                ) : (
                  donations.map(donation => (
                    <tr key={donation.id} className="border-b border-border hover:bg-muted transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Gift className="h-5 w-5 text-primary" />
                          <span className="text-foreground font-medium">{donation.foodName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{donation.recipientName}</td>
                      <td className="px-6 py-4">{getStatusBadge(donation.status)}</td>
                      <td className="px-6 py-4">
                        {donation.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptRequest(donation.id)}
                              className="p-2 hover:bg-green-100 rounded transition-colors text-green-600"
                              title="Accept"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectRequest(donation.id)}
                              className="p-2 hover:bg-red-100 rounded transition-colors text-red-600"
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
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

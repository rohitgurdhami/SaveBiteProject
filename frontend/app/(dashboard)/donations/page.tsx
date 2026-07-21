'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, MapPin, Calendar, User, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import apiClient from '@/services/api';

interface Donation {
  id: number;
  foodName: string;
  donorName: string;
  pickupLocation: string;
  availableUntil: string;
  description?: string;
  status: string;
}

export default function DonationsPage() {
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      if (searchQuery) params.append('search', searchQuery);

      const response = await apiClient.get(`/donations/available?${params}`);
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
  }, [page, searchQuery]);

  const handleRequestDonation = async (donationId: number) => {
    try {
      await apiClient.post('/donation-requests', {
        donationId,
        message: requestMessage,
      });
      setSelectedRequest(null);
      setRequestMessage('');
      alert('Request sent successfully!');
      fetchDonations();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to request donation');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Browse Donations"
        description="Find surplus food available for pickup in your community"
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

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search for food items..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Donations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-muted-foreground">Loading...</div>
          ) : donations.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground">No donations available</div>
          ) : (
            donations.map(donation => (
              <div key={donation.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Food Info */}
                  <div className="flex items-start gap-3 mb-4">
                    <Gift className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">{donation.foodName}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-4 w-4" />
                        {donation.donorName}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {donation.pickupLocation}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Available until {new Date(donation.availableUntil).toLocaleDateString()}
                    </div>
                  </div>

                  {donation.description && (
                    <p className="text-sm text-muted-foreground mb-4">{donation.description}</p>
                  )}

                  {/* Request Button */}
                  <button
                    onClick={() => setSelectedRequest(donation.id)}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Request Donation
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="mt-8 flex items-center justify-between">
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

        {/* Request Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold text-foreground mb-4">Request Donation</h2>
              <textarea
                placeholder="Leave a message for the donor (optional)"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRequestDonation(selectedRequest)}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

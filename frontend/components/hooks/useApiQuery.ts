'use client';

import { useCallback, useEffect, useState } from 'react';

import apiClient from '@/services/api';

type ApiQueryState<TData> = {
  data: TData | null;
  error: string;
  loading: boolean;
};

type UseApiQueryOptions<TData> = {
  enabled?: boolean;
  select?: (responseData: unknown) => TData;
};

const defaultSelect = <TData,>(responseData: unknown) => {
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    return (responseData as { data: TData }).data;
  }

  return responseData as TData;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  return message || fallback;
};

export function useApiQuery<TData>(endpoint: string, options: UseApiQueryOptions<TData> = {}) {
  const { enabled = true, select = defaultSelect<TData> } = options;
  const [state, setState] = useState<ApiQueryState<TData>>({
    data: null,
    error: '',
    loading: enabled,
  });

  const refetch = useCallback(async () => {
    if (!enabled) return null;

    setState((current) => ({ ...current, error: '', loading: true }));

    try {
      const response = await apiClient.get(endpoint);
      const data = select(response.data);
      setState({ data, error: '', loading: false });
      return data;
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getErrorMessage(error, 'Unable to load data. Please try again.'),
        loading: false,
      }));
      return null;
    }
  }, [enabled, endpoint, select]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    ...state,
    refetch,
    setData: (data: TData | null) => setState((current) => ({ ...current, data })),
    setError: (error: string) => setState((current) => ({ ...current, error })),
  };
}

export type { ApiQueryState, UseApiQueryOptions };

'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAllProfiles, type PredictorProfileFields } from '@/lib/sui-client'
import { fetchCopyCreatedEvents, fetchCopySettledEvents } from '@/lib/sui-client'

/** All PredictorProfile objects from on-chain ProfileCreated events */
export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: fetchAllProfiles,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

/** Helper: convert on-chain BPS to percentage string */
export function bpsToPercent(bps: string | number): number {
  return Math.round(Number(bps) / 100)
}

/** CopyCreated events (social feed) */
export function useCopyCreatedEvents(limit = 50) {
  return useQuery({
    queryKey: ['copy-created-events', limit],
    queryFn: () => fetchCopyCreatedEvents(limit),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}

/** CopySettled events (history) */
export function useCopySettledEvents(limit = 50) {
  return useQuery({
    queryKey: ['copy-settled-events', limit],
    queryFn: () => fetchCopySettledEvents(limit),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

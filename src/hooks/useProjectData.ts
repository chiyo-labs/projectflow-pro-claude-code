'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { getDefaultProject } from '@/lib/storage';
import type {
  ProjectData,
  ClientBrief,
  HearingItem,
  Requirements,
  Proposal,
  WbsTask,
  ProgressLog,
  DeliveryItem,
  Retrospective,
  MvpFeature,
  Quote,
  Invoice,
} from '@/types/project';

export function useProjectData() {
  const [data, setData, isHydrated] = useLocalStorage<ProjectData>(
    'projectflow_pro_v1',
    getDefaultProject(),
  );

  const updateBrief = useCallback(
    (v: Partial<ClientBrief>) =>
      setData(p => ({ ...p, brief: { ...p.brief, ...v } })),
    [setData],
  );

  const updateHearing = useCallback(
    (v: HearingItem[]) => setData(p => ({ ...p, hearing: v })),
    [setData],
  );

  const updateRequirements = useCallback(
    (v: Partial<Requirements>) =>
      setData(p => ({ ...p, requirements: { ...p.requirements, ...v } })),
    [setData],
  );

  const updateProposal = useCallback(
    (v: Partial<Proposal>) =>
      setData(p => ({ ...p, proposal: { ...p.proposal, ...v } })),
    [setData],
  );

  const updateWbs = useCallback(
    (v: WbsTask[]) => setData(p => ({ ...p, wbs: v })),
    [setData],
  );

  const updateProgress = useCallback(
    (v: ProgressLog[]) => setData(p => ({ ...p, progress: v })),
    [setData],
  );

  const updateDelivery = useCallback(
    (v: DeliveryItem[]) => setData(p => ({ ...p, delivery: v })),
    [setData],
  );

  const updateRetrospective = useCallback(
    (v: Partial<Retrospective>) =>
      setData(p => ({ ...p, retrospective: { ...p.retrospective, ...v } })),
    [setData],
  );

  const updateMvp = useCallback(
    (v: MvpFeature[]) => setData(p => ({ ...p, mvp: v })),
    [setData],
  );

  const updateQuote = useCallback(
    (v: Quote) => setData(p => ({ ...p, quote: v })),
    [setData],
  );

  const updateInvoice = useCallback(
    (v: Invoice) => setData(p => ({ ...p, invoice: v })),
    [setData],
  );

  return {
    data,
    isHydrated,
    updateBrief,
    updateHearing,
    updateRequirements,
    updateProposal,
    updateWbs,
    updateProgress,
    updateDelivery,
    updateRetrospective,
    updateMvp,
    updateQuote,
    updateInvoice,
  };
}

'use client';

import { useState } from 'react';
import { useProjectData } from '@/hooks/useProjectData';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { ClientBrief } from '@/components/sections/ClientBrief';
import { Hearing } from '@/components/sections/Hearing';
import { Requirements } from '@/components/sections/Requirements';
import { Proposal } from '@/components/sections/Proposal';
import { Wbs } from '@/components/sections/Wbs';
import { Progress } from '@/components/sections/Progress';
import { DeliveryCheck } from '@/components/sections/DeliveryCheck';
import { Retrospective } from '@/components/sections/Retrospective';
import { EmailTemplates } from '@/components/sections/EmailTemplates';
import { MvpDesign } from '@/components/sections/MvpDesign';
import { QuoteSection } from '@/components/sections/Quote';
import { InvoiceSection } from '@/components/sections/Invoice';
import { Settings } from '@/components/sections/Settings';
import { useAppSettings } from '@/hooks/useAppSettings';
import type { SectionId } from '@/types/project';

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto w-full animate-pulse">
      <div className="h-7 w-48 bg-zinc-200 rounded mb-2" />
      <div className="h-4 w-72 bg-zinc-100 rounded mb-8" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-zinc-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function AppShell() {
  const [activeSection, setActiveSection] = useState<SectionId>('brief');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { appSettings, updateAppSettings } = useAppSettings();

  const {
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
  } = useProjectData();

  const renderSection = () => {
    if (!isHydrated) return <LoadingSkeleton />;

    switch (activeSection) {
      case 'brief':
        return (
          <ClientBrief
            data={data.brief}
            onChange={updateBrief}
            onAiGenerateHearing={items => {
              updateHearing(items);
              setActiveSection('hearing');
            }}
          />
        );
      case 'hearing':
        return (
          <Hearing
            data={data.hearing}
            onChange={updateHearing}
            briefData={data.brief}
            onAiGenerateRequirements={req => {
              updateRequirements(req);
              setActiveSection('requirements');
            }}
          />
        );
      case 'requirements':
        return (
          <Requirements
            data={data.requirements}
            onChange={updateRequirements}
            hearingData={data.hearing}
            briefData={data.brief}
            onAiGenerateProposal={proposal => {
              updateProposal(proposal);
              setActiveSection('proposal');
            }}
          />
        );
      case 'proposal':
        return <Proposal data={data.proposal} onChange={updateProposal} />;
      case 'wbs':
        return <Wbs data={data.wbs} onChange={updateWbs} />;
      case 'progress':
        return <Progress data={data.progress} onChange={updateProgress} />;
      case 'delivery':
        return <DeliveryCheck data={data.delivery} onChange={updateDelivery} />;
      case 'retrospective':
        return <Retrospective data={data.retrospective} onChange={updateRetrospective} />;
      case 'mvp':
        return <MvpDesign data={data} onChange={updateMvp} />;
      case 'quote':
        return <QuoteSection data={data} onChange={updateQuote} appSettings={appSettings} />;
      case 'invoice':
        return <InvoiceSection data={data} onChange={updateInvoice} appSettings={appSettings} />;
      case 'email':
        return <EmailTemplates data={data} />;
      case 'settings':
        return <Settings data={appSettings} onChange={updateAppSettings} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50">
      {/* サイドバー（PC: 常時表示） */}
      <div className="hidden md:flex">
        <Sidebar
          activeSection={activeSection}
          onSelect={setActiveSection}
          projectName={data.brief.projectName}
        />
      </div>

      {/* サイドバー（モバイル: オーバーレイ） */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* 背景オーバーレイ */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          {/* サイドバー本体 */}
          <div className="relative z-50 flex">
            <Sidebar
              activeSection={activeSection}
              onSelect={setActiveSection}
              projectName={data.brief.projectName}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* モバイルヘッダー */}
        <MobileHeader
          activeSection={activeSection}
          onMenuOpen={() => setSidebarOpen(true)}
        />

        {/* スクロール可能エリア */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 md:px-8 md:py-8">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}

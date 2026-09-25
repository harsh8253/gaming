import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, FileBarChart, FileClock, FileSpreadsheet, X } from 'lucide-react';
import { DeskSheet } from '../components/DeskSheet';
import { ListRow, MetricCard, MetricStrip, MobileList, PageHeader, StackTable } from '../components/deskUi';
import type { ShellContext } from '../components/WagerDeskShell';
import {
  formatINR,
  MOCK_AUDIT_LOG,
  MOCK_CASH_SESSIONS,
  MOCK_CLIENTS,
  MOCK_COMMISSION_PAYOUTS,
  MOCK_REPORT_EXPORTS,
  MOCK_SETTLEMENTS,
  REPORT_CATALOG,
  type ReportExport,
} from '../lib/mockDesk';

function summaryFor(reportName: string): { label: string; value: string }[] {
  switch (reportName) {
    case 'Client Activity Report':
      return [
        { label: 'Clients', value: String(MOCK_CLIENTS.length) },
        { label: 'Active', value: String(MOCK_CLIENTS.filter((c) => c.status === 'ACTIVE').length) },
      ];
    case 'Settlement Summary':
      return [
        { label: 'Approved', value: String(MOCK_SETTLEMENTS.filter((s) => s.status === 'APPROVED').length) },
        { label: 'Pending', value: String(MOCK_SETTLEMENTS.filter((s) => s.status === 'PENDING').length) },
      ];
    case 'Cash Flow Report':
      return [
        { label: 'Sessions', value: String(MOCK_CASH_SESSIONS.length) },
        { label: 'Physical cash', value: formatINR(MOCK_CASH_SESSIONS.reduce((s, c) => s + c.physicalCount, 0)) },
      ];
    case 'Commission Report':
      return [
        {
          label: 'Total earned',
          value: formatINR(MOCK_COMMISSION_PAYOUTS.reduce((s, p) => s + p.commissionEarned, 0)),
        },
      ];
    default:
      return [{ label: 'Events', value: String(MOCK_AUDIT_LOG.length) }];
  }
}

export function ReportsPage() {
  const { setNotice } = useOutletContext<ShellContext>();
  const [exports, setExports] = useState<ReportExport[]>(MOCK_REPORT_EXPORTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = exports.find((e) => e.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedId(null);
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedId]);

  function generate(reportName: string) {
    const report: ReportExport = {
      id: `EXP-${String(exports.length + 1).padStart(3, '0')}`,
      reportName,
      generatedAt: 'Just now',
      generatedBy: 'Super Admin A',
      sizeLabel: '— KB',
    };
    setExports((prev) => [report, ...prev]);
    setNotice(`${reportName} is generating. It will appear in Recent exports shortly.`);
  }

  return (
    <>
      <PageHeader title="Reports" description="Generate and export reports across your operation." />

      <MetricStrip>
        <MetricCard label="Report types" value={String(REPORT_CATALOG.length)} icon={FileBarChart} accent="blue" sub="Available now" />
        <MetricCard label="Exports this week" value={String(exports.length)} icon={FileSpreadsheet} accent="teal" sub="All report types" />
        <MetricCard label="Last generated" value={exports[0]?.generatedAt ?? '—'} icon={FileClock} accent="amber" sub={exports[0]?.reportName ?? 'No exports yet'} />
      </MetricStrip>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORT_CATALOG.map((report) => (
          <div key={report.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
            <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileBarChart size={17} strokeWidth={1.8} />
            </span>
            <h3 className="mt-3 text-[13px] font-semibold text-slate-900">{report.name}</h3>
            <p className="mt-1 flex-1 text-[12px] text-slate-500">{report.description}</p>
            <button
              onClick={() => generate(report.name)}
              className="mt-4 flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Generate
            </button>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h3 className="text-[14px] font-semibold text-foreground">Recent exports</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Generated reports ready for download</p>
        </div>
        <MobileList label="Recent exports">
          {exports.map((exp) => (
            <ListRow
              key={exp.id}
              onClick={() => setSelectedId(exp.id)}
              title={exp.reportName}
              subtitle={`${exp.generatedBy} · ${exp.generatedAt}`}
              trailingSub={<span className="text-[12px] tabular-nums text-slate-500">{exp.sizeLabel}</span>}
            />
          ))}
        </MobileList>
        <div className="hidden overflow-x-auto md:block">
          <StackTable className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Report</th>
                <th className="px-3 py-3 font-semibold">Generated</th>
                <th className="px-3 py-3 font-semibold">By</th>
                <th className="px-5 py-3 text-right font-semibold">Size</th>
              </tr>
            </thead>
            <tbody>
              {exports.map((exp) => (
                <tr
                  key={exp.id}
                  onClick={() => setSelectedId(exp.id)}
                  className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-3.5 text-[12px] font-semibold text-slate-800">{exp.reportName}</td>
                  <td className="px-3 py-3.5 text-[11px] text-slate-500">{exp.generatedAt}</td>
                  <td className="px-3 py-3.5 text-[12px] text-slate-600">{exp.generatedBy}</td>
                  <td className="px-5 py-3.5 text-right text-[11px] text-muted-foreground">{exp.sizeLabel}</td>
                </tr>
              ))}
            </tbody>
          </StackTable>
        </div>
      </section>

      {selected && (
        <DeskSheet label={selected.reportName} onClose={() => setSelectedId(null)} variant="dialog">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-950">{selected.reportName}</h3>
            <button
              onClick={() => setSelectedId(null)}
              aria-label="Close"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Generated {selected.generatedAt} by {selected.generatedBy}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {summaryFor(selected.reportName).map((row) => (
              <div key={row.label} className="rounded-lg bg-slate-50 px-3 py-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{row.label}</dt>
                <dd className="mt-1 text-[13px] font-semibold tabular-nums text-slate-900">{row.value}</dd>
              </div>
            ))}
          </dl>
          <button
            onClick={() => setNotice(`Download started for ${selected.reportName}.`)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#172554] py-2.5 text-[12px] font-semibold text-white hover:bg-blue-900"
          >
            <Download size={14} /> Download
          </button>
        </DeskSheet>
      )}
    </>
  );
}

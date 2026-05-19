import React, { useMemo, useState } from 'react';
import ConfirmModal from './ConfirmModal';
import '../styles/AccountStagePath.css';

export const PIPELINE_STAGES = [
  { key: 'Prospect',          label: 'Prospect',          sub: 'Initial contact'  },
  { key: 'In-Review',         label: 'In-Review',         sub: 'Under review'     },
  { key: 'Approved',          label: 'Approved',          sub: 'Review approved'  },
  { key: 'Bank Verification', label: 'Bank Verification', sub: 'Verifying bank'   },
  { key: 'Active',            label: 'Active',            sub: 'Account live'     },
  { key: 'Lost',              label: 'Lost',              sub: 'Closed / lost'    },
];

const TERMINAL_STATES = ['lost', 'rejected'];

const CheckIcon = () => (
  <svg width="13" height="10" viewBox="0 0 13 10" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 5 4.5 9 12 1" />
  </svg>
);

const fmtDate = iso => {
  if (!iso) return null;
  const s = /[Zz]|[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z';
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

function AccountStagePath({ currentStatus, changelog = [], onStatusChange, saving = false }) {
  const [pending, setPending] = useState(null); // { stage, isSkip }

  const statusLower  = (currentStatus || '').toLowerCase();
  const isRejected   = statusLower === 'rejected';
  const isTerminal   = TERMINAL_STATES.includes(statusLower);
  const visibleStages = isRejected
    ? [...PIPELINE_STAGES.filter(s => s.key !== 'Lost'), { key: 'Rejected', label: 'Rejected', sub: 'Review rejected' }]
    : PIPELINE_STAGES;
  const currentIdx   = visibleStages.findIndex(s => s.key.toLowerCase() === statusLower);

  const stageDates = useMemo(() => {
    const map = {};
    [...changelog].reverse().forEach(log => {
      const match = visibleStages.find(
        s => s.key.toLowerCase() === (log.new_status || '').toLowerCase()
      );
      if (match) map[match.key] = log.changed_at;
    });
    return map;
  }, [changelog, visibleStages]);

  const progressPct = currentIdx <= 0
    ? 0
    : (currentIdx / (visibleStages.length - 1)) * 100;

  const handleNodeClick = (stage, idx) => {
    if (idx === currentIdx || isTerminal || saving) return;
    const isBack = idx < currentIdx;
    const isSkip = !isBack && idx > currentIdx + 1;
    setPending({ stage, isBack, isSkip });
  };

  const handleConfirm = () => {
    if (pending) onStatusChange(pending.stage.key);
    setPending(null);
  };

  return (
    <>
      <div className="panel sp-panel">
        {/* Header */}

        {/* Stepper — rail via ::before / ::after */}
        <div className="sp-stepper" style={{ '--fill': `${progressPct}%` }}>
          {visibleStages.map((stage, idx) => {
            const isRejectedNode = stage.key === 'Rejected';
            const state    = isTerminal && !isRejectedNode ? 'todo'
                           : idx < currentIdx              ? 'done'
                           : idx === currentIdx            ? 'current'
                           :                                'todo';
            const canClick = !isTerminal && idx !== currentIdx && !saving;
            const date     = stageDates[stage.key];

            return (
              <div
                key={stage.key}
                className={`sp-step sp-step--${state}${canClick ? ' sp-step--clickable' : ''}`}
                onClick={() => handleNodeClick(stage, idx)}
                title={canClick ? (idx < currentIdx ? `Move back to ${stage.label}` : `Move to ${stage.label}`) : undefined}
                style={isRejectedNode && state === 'current' ? { '--node-bg': '#dc2626', '--node-color': '#fff', '--label-color': '#dc2626' } : undefined}
              >
                <div className="sp-node" style={isRejectedNode && state === 'current' ? { background: '#dc2626', color: '#fff', borderColor: '#dc2626' } : undefined}>
                  {state === 'done' ? <CheckIcon /> : isRejectedNode && state === 'current' ? <span>✕</span> : <span>{idx + 1}</span>}
                </div>
                <div className="sp-label" style={isRejectedNode && state === 'current' ? { color: '#dc2626', fontWeight: 700 } : undefined}>{stage.label}</div>
                <div className="sp-sub-label">{date ? fmtDate(date) : stage.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
      </div>

      {/* Confirmation modal */}
      <ConfirmModal
        isOpen={!!pending}
        title={
          pending?.isBack ? `Move back to ${pending?.stage.label}?`
          : pending?.isSkip ? 'Skip stages?'
          : `Move to ${pending?.stage.label}?`
        }
        message={
          pending?.isBack
            ? `This will move the account back to "${pending?.stage.label}". The change will be logged in the activity history.`
            : pending?.isSkip
            ? `This will jump the account directly to "${pending?.stage.label}", bypassing any intermediate stages. Are you sure?`
            : `The account status will be updated to "${pending?.stage.label}". This action will be logged in the activity history.`
        }
        confirmLabel={pending?.isBack ? 'Yes, move back' : pending?.isSkip ? 'Yes, skip ahead' : 'Confirm'}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

export default AccountStagePath;

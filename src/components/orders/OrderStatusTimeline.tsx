import React from 'react';
import { Check, Clock, AlertTriangle, Package, Truck, CheckCircle2 } from 'lucide-react';

interface TimelineEvent {
  id: string;
  toStatus: string;
  title: string;
  description?: string | null;
  createdAt: string;
}

interface OrderStatusTimelineProps {
  currentStatus: string;
  events: TimelineEvent[];
}

const STAGES = [
  { key: 'CONFIRMED', label: 'Order Confirmed', description: 'Acquisition registered and verified' },
  { key: 'PREPARING', label: 'Cellar Preparation', description: 'Flacon hand-inspected and wax-sealed' },
  { key: 'READY_FOR_PICKUP', label: 'Staged for Courier', description: 'Packaging complete with certificate' },
  { key: 'PICKED_UP', label: 'Courier Handover', description: 'Custody transferred to courier' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', description: 'White-glove climate transit' },
  { key: 'DELIVERED', label: 'Handover Completed', description: 'Delivered to recipient' },
];

export default function OrderStatusTimeline({
  currentStatus,
  events,
}: OrderStatusTimelineProps) {
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="bg-red-50 border border-red-200 p-6 flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-red-900">
            Acquisition Cancelled
          </h4>
          <p className="text-xs text-red-700 leading-relaxed">
            This order has been cancelled. Reserved flacons have been restored to cellar inventory and any demo authorization voided.
          </p>
        </div>
      </div>
    );
  }

  // Calculate index of current status
  const currentStageIndex = STAGES.findIndex((s) => s.key === currentStatus);
  const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;

  return (
    <div className="space-y-8">
      {/* Horizontal / Vertical Timeline Stepper */}
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx <= activeIndex;
            const isCurrent = idx === activeIndex;

            // Find matching event timestamp if recorded
            const matchedEvent = events.find((e) => e.toStatus === stage.key);

            return (
              <div
                key={stage.key}
                className={`p-4 border transition-all ${
                  isCurrent
                    ? 'border-black bg-neutral-900 text-white shadow-md'
                    : isCompleted
                    ? 'border-neutral-300 bg-neutral-50 text-neutral-800'
                    : 'border-neutral-200 bg-white text-neutral-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${isCurrent ? 'text-[#C5A059]' : ''}`}>
                    Step 0{idx + 1}
                  </span>
                  {isCompleted ? (
                    <Check className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#C5A059]' : 'text-black'}`} />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-neutral-300" />
                  )}
                </div>

                <div className="font-cinzel text-xs font-semibold mb-1 truncate">
                  {stage.label}
                </div>

                <p className={`text-[10px] line-clamp-2 leading-relaxed ${isCurrent ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  {stage.description}
                </p>

                {matchedEvent && (
                  <div className={`mt-3 pt-2 border-t text-[9px] ${isCurrent ? 'border-neutral-700 text-neutral-400' : 'border-neutral-200 text-neutral-400'}`}>
                    {new Date(matchedEvent.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recorded Event History Log */}
      {events.length > 0 && (
        <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-3">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-black">
            Audited Dispatch Log
          </h4>
          <div className="divide-y divide-neutral-200 text-xs">
            {events.map((ev) => (
              <div key={ev.id} className="py-2.5 flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-neutral-900">{ev.title}</div>
                  {ev.description && (
                    <div className="text-neutral-500 text-[11px] mt-0.5">{ev.description}</div>
                  )}
                </div>
                <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                  {new Date(ev.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

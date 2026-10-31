import React from 'react';
import {
  HelpCircle,
  Tag,
  Percent,
  Plus,
  Minus,
  Receipt,
  Layers,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Drawer from '../ui/Drawer';
import Money from '../ui/Money';
import Badge from '../ui/Badge';

export function WhyDrawer({ isOpen, onClose, line, invoiceNumber, rejectedDiscounts = [] }) {
  if (!line) return null;

  const calcTrail = line.calcTrail || [];

  // Compute running totals if not precomputed
  let running = 0;
  const stepsWithRunning = calcTrail.map((step) => {
    if (step.step === 'total') {
      return { ...step, runningTotal: step.amount };
    }
    running += Number(step.amount || 0);
    return { ...step, runningTotal: running };
  });

  const getStepIcon = (stepType) => {
    switch (stepType) {
      case 'base':
        return <Layers className="h-4 w-4 text-indigo-600" />;
      case 'variant':
        return <Plus className="h-4 w-4 text-sky-600" />;
      case 'plan_fee':
        return <Tag className="h-4 w-4 text-indigo-600" />;
      case 'discount':
      case 'subscription_discount':
        return <Minus className="h-4 w-4 text-emerald-600" />;
      case 'tax':
        return <Receipt className="h-4 w-4 text-amber-600" />;
      case 'total':
        return <CheckCircle2 className="h-4 w-4 text-indigo-700" />;
      default:
        return <HelpCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStepBadge = (stepType) => {
    switch (stepType) {
      case 'base':
        return <Badge variant="blue" size="sm">Base Price</Badge>;
      case 'variant':
        return <Badge variant="sky" size="sm">Variant Extra</Badge>;
      case 'plan_fee':
        return <Badge variant="purple" size="sm">Plan Fee</Badge>;
      case 'discount':
        return <Badge variant="green" size="sm">Product Discount</Badge>;
      case 'subscription_discount':
        return <Badge variant="green" size="sm">Subscription Discount</Badge>;
      case 'tax':
        return <Badge variant="amber" size="sm">Tax (Exclusive)</Badge>;
      case 'total':
        return <Badge variant="purple" size="sm">Final Line Total</Badge>;
      default:
        return null;
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Calculation Breakdown (Why this amount?)"
      description={`Line item breakdown for ${line.description} on ${invoiceNumber || 'Invoice'}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Line summary card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Item</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{line.description}</p>
            <p className="text-xs text-slate-500">Quantity: {line.quantity}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-slate-500">Net Line Total</p>
            <p className="text-lg font-extrabold text-indigo-600">
              <Money amount={line.lineTotal} />
            </p>
          </div>
        </div>

        {/* Vertical Step-by-Step Stepper */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Explainable Calculation Trail
          </h4>

          {stepsWithRunning.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No detailed audit trail recorded for this item.
            </p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {stepsWithRunning.map((step, idx) => {
                const isTotal = step.step === 'total';
                const isDeduction = Number(step.amount) < 0;

                return (
                  <div key={idx} className="relative group">
                    {/* Step Icon Node */}
                    <div
                      className={`absolute -left-6 top-0 h-6 w-6 rounded-full flex items-center justify-center bg-white border-2 shadow-xs transition ${
                        isTotal
                          ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100'
                          : isDeduction
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-300'
                      }`}
                    >
                      {getStepIcon(step.step)}
                    </div>

                    {/* Step Details */}
                    <div
                      className={`p-3.5 rounded-xl border transition ${
                        isTotal
                          ? 'bg-indigo-50/70 border-indigo-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {step.label}
                          </span>
                          {getStepBadge(step.step)}
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            isTotal
                              ? 'text-indigo-900 text-sm'
                              : isDeduction
                              ? 'text-emerald-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {isDeduction ? '' : step.step !== 'total' ? '+' : ''}
                          <Money amount={step.amount} />
                        </span>
                      </div>

                      {step.detail && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {step.detail}
                        </p>
                      )}

                      {/* Running Subtotal indicator */}
                      {!isTotal && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            Running subtotal:
                          </span>
                          <span className="font-semibold text-slate-700">
                            <Money amount={step.runningTotal} />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rejected Discounts Section */}
        {rejectedDiscounts && rejectedDiscounts.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              Discounts Considered But Not Applied
            </h4>
            <div className="space-y-2">
              {rejectedDiscounts.map((disc, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs"
                >
                  <p className="font-semibold text-amber-900">{disc.name}</p>
                  <p className="text-amber-700 mt-0.5">{disc.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default WhyDrawer;

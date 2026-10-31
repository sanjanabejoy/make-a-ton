import React from 'react';

export function PageHeader({ title, description, actions, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}

export default PageHeader;

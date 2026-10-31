import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

export function Popover({ trigger, content, className, align = 'left' }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer inline-flex items-center">
        {trigger}
      </div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-72 rounded-xl bg-white p-4 shadow-soft-lg border border-slate-200 text-xs text-slate-600',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default Popover;

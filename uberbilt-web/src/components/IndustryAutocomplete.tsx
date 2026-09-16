import { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useApp } from '../store';
import type { User } from '../lib/pilotTypes';

export function IndustryAutocomplete({ user }: { user: User }) {
  const { industries, updateUserAccess } = useApp();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unassignedIndustries = industries.filter((ind) => !user.industryAccess.includes(ind.id));
  const filteredIndustries = unassignedIndustries.filter((ind) =>
    ind.name.toLowerCase().includes(query.toLowerCase()),
  );
  
  const assignedIndustries = industries.filter((ind) => user.industryAccess.includes(ind.id));

  const handleAdd = (id: string) => {
    updateUserAccess(user.id, { industryAccess: [id] });
    setQuery('');
    setIsOpen(false);
  };

  const handleRemove = (id: string) => {
    updateUserAccess(user.id, { industryAccess: user.industryAccess.filter((i) => i !== id) });
  };

  return (
    <div className="flex flex-col gap-2 w-[280px]" ref={containerRef}>
      {assignedIndustries.length === 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Assign industry..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full rounded-xl border border-line bg-canvas pl-9 pr-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-brand"
          />
          {isOpen && filteredIndustries.length > 0 && (
            <div className="absolute top-full left-0 z-10 mt-1 w-full rounded-xl border border-line bg-surface py-1 shadow-soft max-h-48 overflow-y-auto">
              {filteredIndustries.map((ind) => (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => handleAdd(ind.id)}
                  className="w-full text-left px-3 py-2 text-[13px] text-ink hover:bg-canvas transition-colors"
                >
                  {ind.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {assignedIndustries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {assignedIndustries.map((ind) => (
            <span
              key={ind.id}
              className="inline-flex items-center gap-1 rounded-full bg-brand/10 pl-2.5 pr-1.5 py-1 text-[12px] font-medium text-brand"
            >
              {ind.name}
              <button
                type="button"
                onClick={() => handleRemove(ind.id)}
                className="rounded-full p-0.5 hover:bg-brand/20 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {assignedIndustries.length === 0 && (
        <p className="text-[12px] text-muted italic mt-1">No industries assigned.</p>
      )}
    </div>
  );
}

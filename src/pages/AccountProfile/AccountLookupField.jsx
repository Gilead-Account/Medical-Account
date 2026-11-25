import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FieldHelpButton } from '@/components/EditModalField';

const lookupMeta = (account) =>
  [account?.eid || account?.accountIdentifier, account?.territory].filter(Boolean).join(' | ');

export default function AccountLookupField({
  label,
  query,
  placeholder,
  searchAccounts,
  onQueryChange,
  onSelect,
  loadingText = 'Searching accounts...',
  emptyText = 'No accounts found.',
  className = '',
  resultLimit = 25,
  portalResults = false,
  required = true,
  help = '',
  helpLabel,
}) {
  const inputId = useId();
  const rootRef = useRef(null);
  const comboboxRef = useRef(null);
  const resultsRef = useRef(null);
  const requestRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [portalStyle, setPortalStyle] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (
        !rootRef.current ||
        rootRef.current.contains(event.target) ||
        resultsRef.current?.contains(event.target)
      ) return;
      setOpen(false);
      setResults([]);
      setError('');
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open]);

  useEffect(() => {
    if (!open || !portalResults) {
      setPortalStyle(null);
      return undefined;
    }

    const positionResults = () => {
      const rect = comboboxRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewportHeight = window.innerHeight;
      const edgeGap = 12;
      const menuGap = 6;
      const availableBelow = viewportHeight - rect.bottom - edgeGap - menuGap;
      const availableAbove = rect.top - edgeGap - menuGap;
      const openAbove = availableBelow < 160 && availableAbove > availableBelow;
      const maxHeight = Math.max(96, Math.min(220, openAbove ? availableAbove : availableBelow));
      setPortalStyle({
        position: 'fixed',
        left: `${rect.left}px`,
        right: 'auto',
        top: openAbove ? 'auto' : `${rect.bottom + menuGap}px`,
        bottom: openAbove ? `${viewportHeight - rect.top + menuGap}px` : 'auto',
        width: `${rect.width}px`,
        maxHeight: `${maxHeight}px`,
      });
    };

    positionResults();
    window.addEventListener('resize', positionResults);
    window.addEventListener('scroll', positionResults, true);
    return () => {
      window.removeEventListener('resize', positionResults);
      window.removeEventListener('scroll', positionResults, true);
    };
  }, [open, portalResults]);

  useEffect(() => {
    if (!open) return undefined;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    setError('');
    const timer = window.setTimeout(() => {
      Promise.resolve(searchAccounts ? searchAccounts(query || '', resultLimit) : [])
        .then((rows) => {
          if (requestRef.current !== requestId) return;
          setResults(rows || []);
          setLoading(false);
        })
        .catch((err) => {
          if (requestRef.current !== requestId) return;
          setResults([]);
          setLoading(false);
          setError(err?.message || 'Account search failed.');
        });
    }, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [open, query, searchAccounts, resultLimit]);

  const handleSelect = (account, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (onSelect) onSelect(account);
    setOpen(false);
    setResults([]);
    setError('');
  };

  const resultsMenu = open ? (
    <div
      ref={resultsRef}
      className={`lookup-results ${portalResults ? 'lookup-results--portal' : ''}`.trim()}
      style={portalResults ? portalStyle || { visibility: 'hidden' } : undefined}
    >
      {results.map((account) => (
        <button
          key={account.id}
          className="lookup-result"
          type="button"
          onMouseDown={(event) => handleSelect(account, event)}
          onClick={(event) => handleSelect(account, event)}
        >
          <strong>{account.name}</strong>
          {lookupMeta(account) && <small>{lookupMeta(account)}</small>}
        </button>
      ))}
      {loading && <div className="lookup-empty">{loadingText}</div>}
      {!loading && !results.length && !error && <div className="lookup-empty">{emptyText}</div>}
      {error && <div className="lookup-empty error">{error}</div>}
    </div>
  ) : null;

  return (
    <div className={`stakeholder-edit-field account-profile-lookup-field ${className}`.trim()} ref={rootRef}>
      <div className="stakeholder-edit-field-label-row">
        <label className="stakeholder-edit-field-label" htmlFor={inputId}>
          {label}
        </label>
        {help && (
          <FieldHelpButton
            className="stakeholder-edit-field-help"
            label={helpLabel || `${label} guidance`}
            text={help}
          />
        )}
      </div>
      <div
        ref={comboboxRef}
        className={`lookup-combobox ${open ? 'is-open' : ''} ${loading ? 'is-loading' : ''}`.trim()}
      >
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          value={query || ''}
          required={required}
          placeholder={placeholder}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            if (onQueryChange) onQueryChange(event.target.value);
            setOpen(true);
          }}
        />
        {!portalResults && resultsMenu}
      </div>
      {portalResults && resultsMenu && typeof document !== 'undefined'
        ? createPortal(resultsMenu, document.body)
        : null}
    </div>
  );
}

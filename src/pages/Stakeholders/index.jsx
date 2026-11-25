import { useState } from 'react';
import '@/pages/Stakeholders/Stakeholders.css';
import StakeholdersTab from '@/pages/Stakeholders/StakeholdersTab';

const DEFAULT_FILTERS = { role: 'All' };

export default function Stakeholders({ data }) {
  const stakeholders = data.stakeholders || [];
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  return (
    <section className="page page-stakeholders-team mock-stakeholder-page">
      <StakeholdersTab
        stakeholders={stakeholders}
        filters={filters}
        onFilterChange={setFilters}
      />
    </section>
  );
}

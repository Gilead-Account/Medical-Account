import { useMemo, useState } from 'react';
import { nextTableSort, stableSortRows } from '@/lib/helper/tableSort';
import TableSortButton from '@/components/TableSortButton';
import AccountProfileFieldHelp from '@/components/AccountProfileFieldHelp';
import { formatCountLabel } from '@/lib/helper/utils';

const referralIndicationDisplay = (indication) => {
  if (!indication) return '-';
  if (indication === 'Both') return 'DLBCL + MM';
  return indication;
};

const REFERRAL_TABLE_COLUMNS = [
  { key: 'name', label: 'Site Name' },
  { key: 'hcoClassification', label: 'HCO Classification' },
  { key: 'indication', label: 'Indication' },
];

const NETWORK_TABLE_COLUMNS = [
  { key: 'accountName', label: 'Account Name' },
  { key: 'kiteAccountable', label: 'Kite Lead' },
];

const referralSortValue = (account, key) => {
  switch (key) {
    case 'name':
      return account.name || null;
    case 'hcoClassification':
      return account.hcoClassification || null;
    case 'indication':
      return account.indication ? referralIndicationDisplay(account.indication) : null;
    default:
      return '';
  }
};

const networkSortValue = (network, key) => {
  switch (key) {
    case 'accountName':
      return network.accountName || null;
    case 'kiteAccountable':
      return network.kiteAccountable || null;
    default:
      return '';
  }
};

function ReferralMappingCard({ referralAccounts, sort, onSort }) {
  const sortedRows = useMemo(
    () => stableSortRows(referralAccounts || [], sort, referralSortValue),
    [referralAccounts, sort]
  );

  return (
    <article className="mock-card profile-table-card referral-mapping-card">
      <div className="mock-section-head">
        <h3 className="account-profile-title-with-help referral-dynamics-title-with-help">
          <span>Referral Mapping</span>
          <AccountProfileFieldHelp helpKey="referralMapping" label="Referral Mapping" />
        </h3>
        <span className="chip chip-blue">
          {formatCountLabel((referralAccounts || []).length, 'site')}
        </span>
      </div>
      <div className="profile-table-list referral-table mock-data-table">
        <div className="profile-table-head">
          {REFERRAL_TABLE_COLUMNS.map((column) => (
            <span key={column.key}>
              <TableSortButton column={column} sort={sort} onSort={onSort} />
            </span>
          ))}
        </div>
        {sortedRows.map((account) => (
          <div className="profile-table-row" key={account.id}>
            <span><strong>{account.name || 'Untitled'}</strong></span>
            <span>{account.hcoClassification || '-'}</span>
            <span>{referralIndicationDisplay(account.indication)}</span>
          </div>
        ))}
        {sortedRows.length === 0 && (
          <div className="empty-state small">No referral mapping rows available.</div>
        )}
      </div>
    </article>
  );
}

function RegionalDynamicsPanel({ indication, content }) {
  return (
    <article className="mock-card regional-dynamics-panel">
      <div className="mock-section-head">
        <h3 className="account-profile-title-with-help referral-dynamics-title-with-help">
          <span>{indication} Regional Dynamics to be aware of</span>
          <AccountProfileFieldHelp helpKey="dlbclRegionalDynamics" label={`${indication} Regional Dynamics`} />
        </h3>
      </div>
      <p className="profile-dynamics-copy">{content || '-'}</p>
    </article>
  );
}

function HealthcareNetworksCard({ rows, sort, onSort }) {
  const sortedRows = useMemo(
    () => stableSortRows(rows || [], sort, networkSortValue),
    [rows, sort]
  );

  return (
    <article className="mock-card profile-table-card healthcare-network-card">
      <div className="mock-section-head">
        <h3 className="healthcare-network-title account-profile-title-with-help referral-dynamics-title-with-help">
          <span className="healthcare-network-title-main">Other Healthcare Networks</span>
          <span className="healthcare-network-title-sub">Region / Influence out of Region</span>
          <AccountProfileFieldHelp helpKey="healthcareNetworks" label="Other Healthcare Networks" />
        </h3>
      </div>
      <div className="profile-table-list network-table is-read-only mock-data-table">
        <div className="profile-table-head">
          {NETWORK_TABLE_COLUMNS.map((column) => (
            <span key={column.key}>
              <TableSortButton column={column} sort={sort} onSort={onSort} />
            </span>
          ))}
        </div>
        {sortedRows.map((network) => (
          <div
            key={network.id}
            className="profile-table-row healthcare-network-open-row"
          >
            <span><strong>{network.accountName || '-'}</strong></span>
            <span>{network.kiteAccountable || '-'}</span>
          </div>
        ))}
        {sortedRows.length === 0 && (
          <div className="empty-state small">No healthcare network rows available.</div>
        )}
      </div>
    </article>
  );
}

export default function ReferralDynamicsTab({
  referralAccounts,
  healthcareNetworks,
  regionalDynamics,
}) {
  const [referralSort, setReferralSort] = useState(null);
  const [networkSort, setNetworkSort] = useState({ key: 'accountName', direction: 'asc' });

  const handleReferralSort = (key) => setReferralSort((current) => nextTableSort(current, key));
  const handleNetworkSort = (key) => setNetworkSort((current) => nextTableSort(current, key));

  return (
    <div className="account-profile-workbook referral-dynamics-workbook">
      <div className="referral-dynamics-layout">
        <div className="referral-dynamics-main">
          <ReferralMappingCard
            referralAccounts={referralAccounts}
            sort={referralSort}
            onSort={handleReferralSort}
          />
        </div>
        <aside className="referral-dynamics-side">
          <RegionalDynamicsPanel
            indication="DLBCL"
            content={regionalDynamics?.DLBCL}
          />
          <RegionalDynamicsPanel
            indication="MM"
            content={regionalDynamics?.MM}
          />
          <HealthcareNetworksCard
            rows={healthcareNetworks}
            sort={networkSort}
            onSort={handleNetworkSort}
          />
        </aside>
      </div>
    </div>
  );
}

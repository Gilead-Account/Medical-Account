import { useEffect, useState } from 'react';
import ProfileTab from '@/pages/AccountProfile/ProfileTab';
import ReferralDynamicsTab from '@/pages/AccountProfile/ReferralDynamicsTab';
import AccountIntelligenceTab from '@/pages/AccountProfile/AccountIntelligenceTab';
import CommercialMmProfileTab from '@/pages/AccountProfile/CommercialMmProfileTab';
import { saveMedicalProfileField } from '@/lib/dataservice/accountPlan/accountProfile';
import '@/styles/edit-modal.css';
import '@/pages/AccountProfile/AccountProfile.css';

const TABS = [
  { key: 'mm-medical-profile', label: 'MM ATC Medical Profile' },
  { key: 'dlbcl-medical-profile', label: 'DLBCL ATC Medical Profile' },
  { key: 'mm-comm-profile', label: 'MM Comm Profile' },
  { key: 'dlbcl-comm-profile', label: 'DLBCL Comm Profile' },
  { key: 'referral-dynamics', label: 'Referral & Dynamics' },
];

const resolveInitialTab = (initialTab) =>
  TABS.some((tab) => tab.key === initialTab) ? initialTab : 'mm-medical-profile';

export default function AccountProfile({ data, initialTab, onNotify, isReadOnly = false }) {
  const [tab, setTab] = useState(() => resolveInitialTab(initialTab));

  const medicalProfileId = data.medicalProfileId;

  useEffect(() => {
    setTab(resolveInitialTab(initialTab));
  }, [initialTab]);

  const handleSaveMmProfile = async (updates) => {
    if (isReadOnly) return;
    const entries = Object.entries(updates || {}).filter(([field]) => field);
    if (!entries.length) return;
    try {
      for (const [field, value] of entries) {
        await saveMedicalProfileField(medicalProfileId, field, value);
      }
      onNotify?.({
        title: 'Medical profile saved.',
        detail: 'Your changes have been saved.',
        refreshPages: true,
      });
    } catch (error) {
      onNotify?.({
        title: 'Unable to save Medical profile.',
        detail: error?.message || 'Please try again.',
        tone: 'danger',
      });
    }
  };

  return (
    <section className="page page-account-profile mock-profile-page">
      <article className="mock-control-panel account-profile-tabs-card">
        <div className="bd-tab-row account-profile-tabs">
          <div className="account-profile-tab-list" role="tablist">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`bd-tab ${tab === item.key ? 'is-active' : ''}`}
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </article>

      {tab === 'referral-dynamics' && (
        <ReferralDynamicsTab
          referralAccounts={data.referralAccounts || []}
          healthcareNetworks={data.healthcareNetworks || []}
          regionalDynamics={data.regionalDynamics || {}}
        />
      )}

      {['mm-medical-profile', 'dlbcl-medical-profile'].includes(tab) && (
        <AccountIntelligenceTab
          profileTitle={tab === 'mm-medical-profile' ? 'MM ATC Medical Profile' : 'DLBCL ATC Medical Profile'}
          profileType={tab === 'mm-medical-profile' ? 'mm' : 'dlbcl'}
          profileRecordId={medicalProfileId}
          values={tab === 'mm-medical-profile'
            ? data.mmMedicalProfile || {}
            : data.dlbclMedicalProfile || {}}
          mmProfilePicklists={data.mmProfilePicklists || {}}
          isReadOnly={isReadOnly}
          onSave={handleSaveMmProfile}
        />
      )}

      {tab === 'mm-comm-profile' && (
        <CommercialMmProfileTab
          values={data.commercialMmProfile || {}}
          mmProfilePicklists={data.mmProfilePicklists || {}}
          isReadOnly
        />
      )}

      {tab === 'dlbcl-comm-profile' && (
        <ProfileTab
          account={data.account}
          attributeRows={data.accountAttributeRows || []}
          reimbursementRows={data.reimbursementRows || []}
          profileQuestionColumns={data.profileQuestionColumns || []}
          yesNoOptions={data.profileQuestionYesNoOptions || []}
          isReadOnly
        />
      )}

    </section>
  );
}

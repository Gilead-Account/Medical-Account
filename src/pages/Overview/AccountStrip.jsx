import HomeFieldHelp from '@/components/HomeFieldHelp';
// Header tiles come from the KPH_Ecosystem_Plan__c fetch (composed into
// `data.header` by loadHome).
const buildHeaderCards = (header) => {
  const h = header || {};
  return [
    // MM ATC Priority comes from the Account record (KPH_MM_ATC_Priority__c).
    { label: 'MM ATC Priority', value: h.mmAtcPriority || 'Not entered' },
    { label: 'ATC Cohort DLBCL', value: h.atcCohort || 'Not entered', helpKey: 'atcCohort' },
  ];
};

export default function AccountStrip({ plan, account, header }) {
  // Heading deliberately omitted — the home page now opens directly with
  // the info cards. The account name still lives in the sidebar card.
  void plan;
  void account;
  const cards = buildHeaderCards(header);

  return (
    <article className="mock-account-strip home-medical-kpi-strip" aria-label="Account priorities">
      <div className="mock-info-grid home-medical-kpi-grid">
        {cards.map((card) => (
          <div key={card.label} className="mock-info-card">
            <div className="mock-info-card-label">
              <span>{card.label}</span>
              <HomeFieldHelp helpKey={card.helpKey} label={card.label} className="home-info-card-help" />
            </div>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

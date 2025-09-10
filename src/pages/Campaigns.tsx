import { AppLayout } from '@/components/layout/AppLayout';
import { CampaignsPage } from '@/components/campaigns/CampaignsPage';
import './Campaigns.css';

const Campaigns = () => {
  return (
    <section
      id="campaign-module"
      className="w-screen max-w-none overflow-x-hidden"
    >
      <AppLayout>
        <CampaignsPage />
      </AppLayout>
    </section>
  );
};

export default Campaigns;

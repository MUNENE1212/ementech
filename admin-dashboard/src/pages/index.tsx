/**
 * Page exports
 */

export { Login } from './Login';
export { Dashboard } from './Dashboard';
export { Leads } from './Leads';
export { Campaigns } from './Campaigns';
export { Sequences } from './Sequences';
export { Templates } from './Templates';
export { Social } from './Social';
export { Analytics } from './Analytics';
export { Employees } from './Employees';
export { Settings } from './Settings';

// Placeholder pages for detail views
export const LeadDetail = () => <div className="p-6">Lead Detail Page - Coming Soon</div>;
export const CampaignDetail = () => <div className="p-6">Campaign Detail Page - Coming Soon</div>;
export const SequenceDetail = () => <div className="p-6">Sequence Detail Page - Coming Soon</div>;
export const TemplateDetail = () => <div className="p-6">Template Detail Page - Coming Soon</div>;
export const SocialPostDetail = () => <div className="p-6">Social Post Detail Page - Coming Soon</div>;
export const AccountDetail = () => <div className="p-6">Account Detail Page - Coming Soon</div>;
export const EmployeeDetail = () => <div className="p-6">Employee Detail Page - Coming Soon</div>;
export const NotFound = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-500">Page not found</p>
    </div>
  </div>
);
export const Unauthorized = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
      <p className="text-gray-500">You don't have permission to access this page</p>
    </div>
  </div>
);

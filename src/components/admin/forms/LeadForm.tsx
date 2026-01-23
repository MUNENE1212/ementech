/**
 * LeadForm Component
 * Form for creating/editing leads
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import type { Lead } from '../../../types/admin/admin';

interface LeadFormProps {
  lead?: Partial<Lead>;
  onSubmit: (data: Partial<Lead>) => void | Promise<void>;
  onCancel?: () => void;
}

const PIPELINE_STAGES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'email', label: 'Email' },
  { value: 'ads', label: 'Ads' },
  { value: 'other', label: 'Other' },
];

export const LeadForm: React.FC<LeadFormProps> = ({ lead, onSubmit, onCancel }) => {
  const [formData, setFormData] = React.useState({
    firstName: lead?.firstName || '',
    lastName: lead?.lastName || '',
    email: lead?.email || '',
    company: lead?.company || '',
    phone: lead?.phone || '',
    status: lead?.status || 'new',
    source: lead?.source || '',
    notes: lead?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form id="lead-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          required
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          required
        />
      </div>

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Company"
          value={formData.company}
          onChange={(e) => handleChange('company', e.target.value)}
        />
        <Input
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Status"
          options={PIPELINE_STAGES}
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
        />
        <Select
          label="Source"
          options={LEAD_SOURCES}
          value={formData.source}
          onChange={(e) => handleChange('source', e.target.value)}
          placeholder="Select source"
        />
      </div>

      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
        rows={4}
        placeholder="Add any additional notes..."
      />

      {onCancel && (
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Lead</Button>
        </div>
      )}
    </form>
  );
};

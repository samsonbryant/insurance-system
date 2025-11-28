// Insurance types for dropdowns
export const INSURANCE_TYPES = [
  { value: 'auto', label: 'Auto Insurance' },
  { value: 'motor_third_party', label: 'Motor Third Party' },
  { value: 'motor_comprehensive', label: 'Motor Comprehensive' },
  { value: 'guaranteed_bond', label: 'Guaranteed Bond' },
  { value: 'indemnity_bond', label: 'Indemnity Bond' },
  { value: 'fire', label: 'Fire Insurance' },
  { value: 'marine', label: 'Marine Insurance' },
  { value: 'life', label: 'Life Insurance' },
  { value: 'medical', label: 'Medical Insurance' },
  { value: 'travel', label: 'Travel Insurance' },
  { value: 'real_property', label: 'Real Property Insurance' },
  { value: 'health', label: 'Health Insurance' },
  { value: 'property', label: 'Property Insurance' },
  { value: 'business', label: 'Business Insurance' },
  { value: 'other', label: 'Other' }
];

export const getInsuranceTypeLabel = (value) => {
  const type = INSURANCE_TYPES.find(t => t.value === value);
  return type ? type.label : value;
};


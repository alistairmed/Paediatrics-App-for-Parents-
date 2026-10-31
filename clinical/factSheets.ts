/**
 * Trusted, general information for parents. The app links here instead of
 * giving advice about a specific child. Addresses checked October 2026.
 */
export interface FactSheet {
  title: string;
  url: string;
  summary: string;
}

export const RCH_FACT_SHEETS = {
  painRelief: {
    title: 'Pain-relief medicine for children',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Pain_relief_for_children/',
    summary: 'Paracetamol and ibuprofen: when to use them and how to give them safely.',
  },
  fever: {
    title: 'Fever in children',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/fever_in_children/',
    summary: 'What a fever means, how to keep your child comfortable, and when to see a doctor.',
  },
  dehydration: {
    title: 'Dehydration in babies and children',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Dehydration/',
    summary: 'Signs of dehydration and how to keep your child drinking.',
  },
  febrileSeizures: {
    title: 'Febrile seizures',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/febrile_convulsions/',
    summary: 'Seizures with fever: what to do and when to call an ambulance.',
  },
  croup: {
    title: 'Croup',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/croup/',
    summary: 'Barking cough and noisy breathing: care at home and warning signs.',
  },
  bronchiolitis: {
    title: 'Bronchiolitis',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/bronchiolitis/',
    summary: 'A chest infection in babies: feeding, breathing and when to get help.',
  },
  headInjury: {
    title: 'Head injuries',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Head_injury/',
    summary: 'Caring for a head injury and the signs that need urgent care.',
  },
  all: {
    title: 'All RCH Kids Health Info fact sheets',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/',
    summary: 'The Royal Children\'s Hospital Melbourne library of parent fact sheets.',
  },
} satisfies Record<string, FactSheet>;

export const HELPLINES = [
  { name: 'Emergency (ambulance)', number: '000', note: 'If your child is seriously unwell or you think their life is at risk.' },
  { name: 'healthdirect', number: '1800 022 222', note: 'Speak to a registered nurse, any time.' },
  { name: 'Poisons Information Centre', number: '13 11 26', note: 'If your child may have taken too much medicine or swallowed something harmful.' },
];

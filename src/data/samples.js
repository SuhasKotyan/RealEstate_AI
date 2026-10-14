import { analysisSchema, leadSchema } from '../../shared/contracts.mjs';

const entries = [
  {
    name: 'Ananya Sharma',
    location: 'Whitefield, Bengaluru',
    property: '3 BHK apartment · ready to move',
    budget: '₹1.4–1.6 crore',
    timeline: 'Within 30 days',
    message:
      'Hi! We are looking for a ready-to-move 3 BHK in Whitefield, ideally near the metro. Our budget is 1.4 to 1.6 crore including registration. We want to finalize within 30 days. A covered parking spot is essential. I am worried about hidden maintenance charges. Can we visit this Saturday after 11 AM?',
    summary:
      'Looking for a ready-to-move 3 BHK in Whitefield, close to the metro. Wants to finalize within 30 days and has requested a Saturday visit.',
    intent: 'Active buyer · requesting a property visit',
    requirements: [
      'Ready-to-move 3 BHK in Whitefield',
      'Near the metro',
      '₹1.4–1.6 crore, including registration',
      'Covered parking',
    ],
    concerns: ['Hidden maintenance charges; wants cost transparency.'],
    missingInformation: ['Is financing arranged?', 'What maximum distance from the metro works?'],
    nextAction:
      'Call to confirm Saturday availability and clarify the all-in budget before proposing a shortlist.',
    suggestedResponse:
      'Hi Ananya, thanks for sharing your requirements. I’ve noted a ready-to-move 3 BHK in Whitefield near the metro, covered parking, and an all-in budget of ₹1.4–1.6 crore. Let’s clarify maintenance and registration costs upfront. May I call you to discuss a shortlist and check visit options for Saturday after 11 AM?',
    points: [34, 24, 24, 14],
    reasons: [
      'Explicit 30-day purchase window.',
      'Location, size, possession and all-in budget are specific.',
      'Wants to finalize and asks for a property visit.',
      'Provides a specific visit day and time; financing remains unknown.',
    ],
    evidence: [
      { field: 'message', quote: 'We want to finalize within 30 days.' },
      { field: 'message', quote: 'Can we visit this Saturday after 11 AM?' },
    ],
  },
  {
    name: 'Rohan Mehta',
    location: 'Baner, Pune',
    property: '2 BHK apartment · resale preferred',
    budget: '₹85–95 lakh',
    timeline: 'Within 2 months',
    message:
      'I need a 2 BHK in Baner, resale is fine. Budget is 85–95 lakh. Hoping to buy in the next two months. I have shortlisted a few societies and would like to compare them. Can you share the total monthly maintenance and parking details? Call me tomorrow evening.',
    summary:
      'Shortlisting 2 BHK resale options in Baner within ₹85–95 lakh. Plans to buy within two months and wants to compare maintenance and parking.',
    intent: 'Comparing options · open to a call',
    requirements: [
      '2 BHK in Baner',
      'Resale acceptable',
      '₹85–95 lakh',
      'Maintenance and parking details',
    ],
    concerns: ['Ongoing maintenance cost is a decision factor.'],
    missingInformation: [
      'Which societies are already shortlisted?',
      'Is the budget inclusive of transaction costs?',
    ],
    nextAction:
      'Confirm a call time tomorrow evening and ask for the shortlisted societies to structure the comparison.',
    suggestedResponse:
      'Hi Rohan, I can help you compare 2 BHK resale options in Baner with maintenance and parking details. Could you share the societies you’ve shortlisted and whether ₹85–95 lakh includes transaction costs? What time tomorrow evening would suit a quick call?',
    points: [26, 23, 23, 12],
    reasons: [
      'Purchase planned within two months.',
      'Clear location, size and budget; transaction-cost scope unknown.',
      'Actively shortlisting and comparing societies.',
      'Requests a call tomorrow evening.',
    ],
    evidence: [
      { field: 'message', quote: 'Hoping to buy in the next two months.' },
      { field: 'message', quote: 'Call me tomorrow evening.' },
    ],
  },
  {
    name: 'Priya Nair',
    location: 'Kondapur, Hyderabad',
    property: '3 BHK apartment · gated community',
    budget: 'Around ₹1.2 crore',
    timeline: '3–6 months',
    message:
      'We are exploring 3 BHK apartments in gated communities in Kondapur. Budget around 1.2 crore. We may buy in 3 to 6 months, depending on our current home sale. Would prefer a gym and good ventilation. Not ready for visits yet, please share information by message.',
    summary:
      'Exploring gated-community 3 BHK apartments in Kondapur. Purchase depends on selling the current home, with a tentative 3–6 month timeline.',
    intent: 'Early research · prefers information by message',
    requirements: [
      '3 BHK in Kondapur',
      'Gated community with gym',
      'Good ventilation',
      'Budget around ₹1.2 crore',
    ],
    concerns: ['Purchase depends on the current home sale.', 'Not ready for site visits.'],
    missingInformation: [
      'Is the existing home already listed?',
      'Are transaction costs included in the budget?',
    ],
    nextAction:
      'Send a brief requirements recap by message and ask permission to check in after the home-sale milestone.',
    suggestedResponse:
      'Hi Priya, I’ve noted your preference for a well-ventilated 3 BHK in a gated community in Kondapur, with a gym and a budget around ₹1.2 crore. I’ll keep the conversation on messages as you prefer. Is your current home already listed, and when would a follow-up be useful?',
    points: [15, 21, 16, 5],
    reasons: [
      'Tentative three-to-six-month timeline.',
      'Specific area, property and amenities; approximate budget.',
      'Exploring with a home-sale dependency.',
      'Prefers messages and explicitly declines visits for now.',
    ],
    evidence: [
      { field: 'message', quote: 'depending on our current home sale' },
      { field: 'message', quote: 'Not ready for visits yet' },
    ],
  },
  {
    name: 'Arjun Kapoor',
    location: 'Gurugram',
    property: 'Investment apartment · open to options',
    budget: 'Not decided yet',
    timeline: '6–12 months',
    message:
      'Just checking investment options in Gurugram. No fixed budget or area yet. Maybe later this year or next. Please send an overview; I do not want a call right now. What should I know about rental demand?',
    summary:
      'Researching investment apartments in Gurugram with no fixed budget or locality. Prefers an overview by message and does not want a call.',
    intent: 'Exploratory investor · low immediate urgency',
    requirements: ['Investment apartment in Gurugram', 'Overview by message'],
    concerns: ['Wants to understand rental demand before committing.', 'Does not want a call.'],
    missingInformation: [
      'What budget range is comfortable?',
      'Is the goal rental income or future resale?',
      'Which localities are acceptable?',
    ],
    nextAction:
      'Send a short investment-needs questionnaire by message, respecting the no-call preference.',
    suggestedResponse:
      'Hi Arjun, happy to keep this on messages. To make an investment overview useful, what budget range are you considering and is your main goal rental income or future resale? Rental demand needs to be checked for specific localities and properties; I’d avoid promising returns without that information.',
    points: [6, 8, 9, 3],
    reasons: [
      'Long or uncertain six-to-twelve-month window.',
      'No fixed budget or specific locality.',
      'General research without a purchase commitment.',
      'Declines a call and only requests an overview.',
    ],
    evidence: [
      { field: 'message', quote: 'No fixed budget or area yet.' },
      { field: 'message', quote: 'I do not want a call right now.' },
    ],
  },
  {
    name: 'Neha Desai',
    location: 'Powai, Mumbai',
    property: '2 BHK apartment · ready to move',
    budget: '₹2–2.3 crore',
    timeline: 'Within 45 days',
    message:
      'Looking for a ready-to-move 2 BHK in Powai, up to 2.3 crore. I can stretch only if all costs are included. Need to move in about 45 days. Could we discuss options? Please check the society rules on pets before suggesting anything.',
    summary:
      'Needs a ready-to-move 2 BHK in Powai within about 45 days. The all-in cost ceiling and pet rules will shape the shortlist.',
    intent: 'Active buyer · wants to discuss options',
    requirements: [
      'Ready-to-move 2 BHK in Powai',
      'Budget up to ₹2.3 crore, all costs included',
      'Move in about 45 days',
      'Verify society pet rules',
    ],
    concerns: [
      'Limited flexibility beyond the all-in cost ceiling.',
      'Pet rules need verification.',
    ],
    missingInformation: ['What time works for a call?', 'Is financing arranged?'],
    nextAction:
      'Agree a call time and verify all-in costs and pet rules before proposing properties.',
    suggestedResponse:
      'Hi Neha, I’ve noted your ready-to-move 2 BHK requirement in Powai and your all-in ceiling of ₹2.3 crore. We should verify the full costs and society pet rules before considering any property. When would you be available for a quick call to discuss your priorities?',
    points: [28, 23, 22, 10],
    reasons: [
      'Wants to move within about 45 days.',
      'Clear location, size, possession and cost ceiling.',
      'Explicit purchase requirement and request to discuss.',
      'Open to discussing options; no call time confirmed.',
    ],
    evidence: [
      { field: 'message', quote: 'Need to move in about 45 days.' },
      { field: 'message', quote: 'Please check the society rules on pets' },
    ],
  },
];

// Hand-authored examples are explicitly marked sample throughout the product.
// Newly submitted leads and all chat answers always use the real API.
export function createSampleLeads(now = Date.now()) {
  return entries.map((entry, index) => {
    const intake = Object.fromEntries(
      ['name', 'location', 'property', 'budget', 'timeline', 'message'].map((key) => [
        key,
        entry[key],
      ]),
    );
    const analysis = analysisSchema.parse({
      ...entry,
      scores: Object.fromEntries(
        ['urgency', 'clarity', 'intent', 'readiness'].map((key, i) => [
          key,
          { points: entry.points[i], reason: entry.reasons[i] },
        ]),
      ),
    });
    return leadSchema.parse({
      id: `sample-${index + 1}`,
      intake,
      analysis,
      source: 'sample',
      status: index === 1 ? 'Contacted' : 'New',
      createdAt: new Date(now - (index + 1) * 3600000).toISOString(),
      analyzedAt: null,
      model: null,
      chat: [],
      followup:
        index === 1
          ? {
              task: 'Confirm evening call time and collect shortlisted societies.',
              dueAt: new Date(now - 30 * 60000).toISOString(),
              done: false,
            }
          : null,
      activity:
        index === 1
          ? [
              {
                id: 'sample-activity',
                at: new Date(now - 3600000).toISOString(),
                type: 'note',
                text: 'Sample note: customer asked for a comparison before the call.',
              },
            ]
          : [],
    });
  });
}

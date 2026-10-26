export interface HomeContent {
  trustItems: string[];
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroPrimaryLabel: string;
  heroSecondaryLabel: string;
  highlightsEyebrow: string;
  highlightsTitle: string;
  highlightsDescription: string;
  ingredientsEyebrow: string;
  ingredientsTitle: string;
  ingredients: { name: string; note: string }[];
  wellnessQuotes: string[];
  reviewEyebrow: string;
  reviewTitle: string;
  reviewDescription: string;
  reviewFormTitle: string;
  reviewFormDescription: string;
  standardsEyebrow: string;
  standardsTitle: string;
  standards: { title: string; copy: string }[];
  storyEyebrow: string;
  storyTitle: string;
  storyDescription: string;
  storyLinkLabel: string;
  storyImageUrl: string;
  aboutImageUrl: string;
  newsletterEyebrow: string;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterButtonLabel: string;
}

export const DEFAULT_HOME_CONTENT: HomeContent = {
  trustItems: ['Free shipping over ₹999', 'Quality assured', 'Cash on delivery', 'Order support'],
  heroEyebrow: 'Rooted in nature · Made for everyday wellness',
  heroTitle: 'Nature, thoughtfully.',
  heroDescription: 'Ayurvedic-inspired wellness for everyday life.',
  heroPrimaryLabel: 'Shop Now',
  heroSecondaryLabel: 'Learn More',
  highlightsEyebrow: 'A closer look',
  highlightsTitle: 'Thoughtfully chosen for your routine',
  highlightsDescription: 'Get to know a few products from the Neel Solutions range.',
  ingredientsEyebrow: 'Rooted in tradition',
  ingredientsTitle: 'We name every ingredient',
  ingredients: [
    { name: 'Turmeric', note: 'Golden root' },
    { name: 'Moringa', note: 'The drumstick tree' },
    { name: 'Brahmi', note: 'Traditional herb' },
    { name: 'Triphala', note: 'Three-fruit blend' },
    { name: 'Shatavari', note: 'Traditional root' },
    { name: 'Neem', note: 'Evergreen tree' },
    { name: 'Tulsi', note: 'Holy basil' },
  ],
  wellnessQuotes: [
    'Wellness can begin with one small, thoughtful choice.',
    'A mindful routine grows one day at a time.',
  ],
  reviewEyebrow: 'Customer stories',
  reviewTitle: 'Real people. Real experiences.',
  reviewDescription: 'Tried a Neel Solutions product? Share your honest experience and rating with our team.',
  reviewFormTitle: 'Share your experience',
  reviewFormDescription: 'Your review opens as an email to our team. It will only be shared on the site after it has been received and approved.',
  standardsEyebrow: 'The details matter',
  standardsTitle: 'A thoughtful experience, from browsing to delivery.',
  standards: [
    { title: 'Clear product details', copy: 'Review descriptions and pricing before you decide what is right for you.' },
    { title: 'Flexible checkout', copy: 'Choose from the payment options available for your order and delivery area.' },
    { title: 'Order updates', copy: 'Sign in to follow your order as it moves through its delivery journey.' },
  ],
  storyEyebrow: 'Why Neel Solutions',
  storyTitle: 'Wellness, with care in every detail.',
  storyDescription: 'Neel Solutions is part of the Neel Group, guided by a simple idea: creating a healthy world starts with helping people make thoughtful everyday choices.',
  storyLinkLabel: 'About Neel Solutions',
  storyImageUrl: '/admin-nature.svg',
  aboutImageUrl: '/admin-nature.svg',
  newsletterEyebrow: 'A note from Neel Solutions',
  newsletterTitle: 'Wellness updates, by email',
  newsletterDescription: 'Leave your email and your mail app will open with a subscription request addressed to our team.',
  newsletterButtonLabel: 'Subscribe',
};

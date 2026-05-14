import { Sparkles, ListChecks, Clock, Utensils } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI Ingredient Detection',
    description: 'Our AI reads any menu and identifies every ingredient automatically.',
  },
  {
    icon: ListChecks,
    title: 'Personal Blacklist',
    description: 'Save your allergens and restrictions once. They apply to every scan.',
  },
  {
    icon: Clock,
    title: 'Scan History',
    description: 'Every scan is saved so you can revisit results and share with others.',
  },
  {
    icon: Utensils,
    title: 'Works Anywhere',
    description:
      'Restaurants, grocery labels, recipe sites — if it has ingredients, we can scan it.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-card py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display text-2xl font-semibold text-foreground text-center mb-10">
          Everything you need to eat safely
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-card rounded-xl border border-border shadow-sm p-5"
            >
              <div className="bg-secondary rounded-lg p-2 inline-flex">
                <Icon className="size-8 text-secondary-foreground" />
              </div>
              <p className="font-display text-base font-semibold text-foreground mt-3 mb-1">
                {title}
              </p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

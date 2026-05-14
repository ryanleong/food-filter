import { ListChecks, ScanLine, ShieldCheck } from 'lucide-react';

const steps = [
  {
    icon: ListChecks,
    title: 'Add your restrictions',
    description: 'Tell us your allergens and dietary rules once.',
  },
  {
    icon: ScanLine,
    title: 'Scan any menu',
    description: 'Paste or photograph any menu or food label.',
  },
  {
    icon: ShieldCheck,
    title: "See what's safe",
    description: 'Instantly know which dishes you can eat.',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-background py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-2xl font-semibold text-foreground text-center mb-12">
          How It Works
        </h2>
        <div className="flex flex-col md:grid md:grid-cols-3 gap-10">
          {steps.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center text-center gap-4">
              <div className="bg-secondary rounded-xl p-2.5">
                <Icon className="size-10 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

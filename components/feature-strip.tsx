import { Clock3, Medal, Shirt, ShieldCheck } from "lucide-react";

const features = [
  { icon: Clock3, label: "Hourly booking, no minimum stay" },
  { icon: Medal, label: "All skill levels welcome" },
  { icon: ShieldCheck, label: "Changing rooms & lockers on site" },
  { icon: Shirt, label: "Paddle & ball rentals available" },
];

export function FeatureStrip() {
  return (
    <section className="flex flex-col gap-3 bg-sage-pale px-[6vw] py-5 lg:flex-row lg:items-center lg:justify-center lg:gap-10">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <div key={feature.label} className="flex items-center gap-3 text-sm font-semibold text-ink-mid">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-mid shadow-sm">
              <Icon size={18} aria-hidden="true" />
            </span>
            {feature.label}
          </div>
        );
      })}
    </section>
  );
}

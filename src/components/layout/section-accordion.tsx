import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SectionAccordionItem = {
  id: string;
  title: string;
  hint?: string;
  badge?: string;
  children: ReactNode;
};

type Props = {
  sections: SectionAccordionItem[];
  defaultOpen?: string[];
  className?: string;
};

export function SectionAccordion({ sections, defaultOpen = [], className }: Props) {
  if (!sections.length) return null;

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpen}
      className={cn("space-y-3", className)}
    >
      {sections.map((section) => (
        <AccordionItem
          key={section.id}
          value={section.id}
          className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm border-b-0"
        >
          <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
            <div className="flex flex-1 items-center gap-2 text-left">
              <span className="text-sm font-semibold tracking-tight">{section.title}</span>
              {section.badge && (
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {section.badge}
                </Badge>
              )}
              {section.hint && (
                <span className="hidden text-xs text-muted-foreground sm:inline">{section.hint}</span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">{section.children}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

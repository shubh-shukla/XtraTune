import { AlbumCard } from "@/components/album-card";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { Separator } from "@/components/ui/separator";
import { type Chart } from "@/typings/homepage";

export const TopCharts = ({ charts }: { charts: Chart[] }) => {
  return (
    <section className="space-y-4 border-none">
      <div className="mt-6 space-y-1">
        <h2 className="text-3xl font-cal font-semibold tracking-wide ">Top Charts</h2>
      </div>
      <Separator className="my-4" />
      <HorizontalScroll>
        <div className="flex gap-4 pr-8">
          {charts.map((chart) => (
            <AlbumCard
              key={chart.id}
              id={chart.id}
              imageURL={chart.image}
              title={chart.title}
              type={chart.type}
              url={chart.url}
              language={chart.language}
              height={200}
              width={200}
              className="w-[200px]"
            />
          ))}
        </div>
      </HorizontalScroll>
    </section>
  );
};

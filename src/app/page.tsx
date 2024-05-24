import { TrendingSongs } from "./sections/trending-songs";
import { TopCharts } from "./sections/top-charts";
import { Albums } from "./sections/albums";
export const dynamic = "force-dynamic"
export default async function Home() {
  return (
    <>
      <TrendingSongs />
      <TopCharts />
      <Albums />
    </>
  );
}

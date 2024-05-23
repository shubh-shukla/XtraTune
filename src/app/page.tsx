import { TrendingSongs } from "./sections/trending-songs";
export const dynamic = "force-dynamic"
export default async function Home() {
  return (
    <>
      <TrendingSongs />
    </>
  );
}

const fetchMusic = async (id: string) => {
  const res = await fetch("/api/musicData", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(`fetchMusic failed: ${res.status}`);
  return res.json();
};

export default fetchMusic;

import { music } from "@/lib/music";
import { SearchData } from "@/typings/searchdata";

export const search = async (slug: string) => {
    try {
                const { data } = await music.get(`/search?query=${slug}`);
                const toImage = (image: any) => ({ ...image, link: image.url });
                const mapItems = (items: any[] = []) =>
                    items.map((item, index) => ({
                        ...item,
                        title: item.title ?? item.name ?? "",
                        image: item.image?.map(toImage) ?? [],
                        position: typeof item.position === "number" ? item.position : index,
                    }));

                const payload: SearchData = {
                    status: data.success ? "SUCCESS" : "FAILED",
                    message: null,
                    data: {
                        topQuery: {
                            results: mapItems(data.data?.topQuery?.results),
                            position: data.data?.topQuery?.position ?? 0,
                        },
                        songs: {
                            results: mapItems(data.data?.songs?.results),
                            position: data.data?.songs?.position ?? 0,
                        },
                        albums: {
                            results: mapItems(data.data?.albums?.results),
                            position: data.data?.albums?.position ?? 0,
                        },
                        artists: {
                            results: mapItems(data.data?.artists?.results),
                            position: data.data?.artists?.position ?? 0,
                        },
                        playlists: {
                            results: mapItems(data.data?.playlists?.results),
                            position: data.data?.playlists?.position ?? 0,
                        },
                    },
                };

                return payload;
    } catch (error) {
        console.log(error);
    }
    return null;
};
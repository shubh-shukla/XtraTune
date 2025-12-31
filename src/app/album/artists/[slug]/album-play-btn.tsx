"use client"

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useSongStore } from "@/store/song-store";
import { Song } from "@/typings/albumdata";
import { Song as Playlist } from "@/typings/playlist";

 
export const AlbumPlayBtn = ({ album }: { album: Song[] | Playlist[] }) => {
    const setPlaylist = useSongStore(state=>state.setPlaylist);
    const setCurrentIndex = useSongStore(state=>state.setCurrentSong);
    const startPlaylist=()=>{
        setPlaylist(
          album.map((song) => ({
            id: song.id,
            title: song.name.split("(")[0].replace("&#039;", "'"),
            artist: song.primaryArtists,
            image: song.image?.[1]?.link || song.image?.[0]?.link,
            duration: Number(song.duration),
          })),
          0
        )
        setCurrentIndex(0)
    }
    return(
        <div className="flex gap-2 items-center">
              <Button
              onClick={startPlaylist}
                variant="default"
                className="active:scale-90 transition-transform"
                size={"icon"}
              >
                <Icons.play className="" />
              </Button>
              <Button variant="secondary">Share</Button>
            </div>
    )
};
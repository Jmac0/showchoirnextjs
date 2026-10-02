import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AudioAndLyricsContainer } from "@/src/components/members/AudioAndLyricsContainer";
import { MemberTrack } from "@/src/lib/musicShared";

// A song's tracks as members get them (links would be signed R2 links)
const tracks: MemberTrack[] = [
  {
    id: "1",
    kind: "audio",
    part: "all",
    label: "All Voices",
    url: "https://storage/all.mp3?sig",
    download_url: "https://storage/all.mp3?sig&dl",
  },
  {
    id: "2",
    kind: "audio",
    part: "soprano",
    label: "Sopranos",
    url: "https://storage/sop.mp3?sig",
    download_url: "https://storage/sop.mp3?sig&dl",
  },
  {
    id: "3",
    kind: "lyrics",
    label: "Lyrics",
    url: "https://storage/lyrics.pdf?sig",
    download_url: "https://storage/lyrics.pdf?sig&dl",
  },
];

describe("AudioAndLyricsContainer", () => {
  it("Should show the song, a player per audio track and the lyrics links", async () => {
    const user = userEvent.setup();
    render(<AudioAndLyricsContainer title="Memory" tracks={tracks} />);

    expect(screen.getByRole("heading", { name: "Memory" })).toBeInTheDocument();
    // The drawer starts closed
    screen
      .getAllByTestId("audio-draw")
      .forEach((el) => expect(el).toHaveClass("max-h-0"));
    await user.click(screen.getByRole("button", { name: /memory/i }));
    screen
      .getAllByTestId("audio-draw")
      .forEach((el) => expect(el).not.toHaveClass("max-h-0"));

    // 2 audio players, which don't load anything until played
    const players = screen.getAllByTestId("audio-player");
    expect(players).toHaveLength(2);
    players.forEach((p) => expect(p).toHaveAttribute("preload", "none"));

    // Downloads use the download links (not the play links)
    const downloads = screen.getAllByRole("link", { name: /download track/i });
    expect(downloads[0]).toHaveAttribute("href", tracks[0].download_url);

    // Lyrics: view (new tab) and download
    expect(screen.getByRole("link", { name: /view lyrics/i })).toHaveAttribute(
      "href",
      tracks[2].url
    );
    expect(
      screen.getByRole("link", { name: /download lyrics/i })
    ).toHaveAttribute("href", tracks[2].download_url);
  });
});

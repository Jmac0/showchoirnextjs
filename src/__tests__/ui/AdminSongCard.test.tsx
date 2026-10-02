import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AdminSongCard } from "@/src/components/members/AdminSongCard";
import { AdminSong } from "@/src/lib/musicShared";

const song: AdminSong = {
  id: "s1",
  title: "Memory",
  status: "current",
  tracks: [
    {
      id: "t1",
      kind: "audio",
      part: "tenor",
      label: "Tenors",
      file_name: "memory-tenors.mp3",
      size: 3 * 1024 * 1024,
      uploaded_at: "2026-10-02T10:00:00.000Z",
    },
    {
      id: "t2",
      kind: "lyrics",
      label: "Lyrics",
      file_name: "memory-lyrics.pdf",
      size: 20 * 1024,
      uploaded_at: "2026-10-02T10:00:00.000Z",
    },
  ],
};

describe("Admin song card", () => {
  it("Should start closed showing the title and file count, and open on click", async () => {
    const user = userEvent.setup();
    render(<AdminSongCard song={song} onChange={jest.fn()} />);

    const header = screen.getByRole("button", { name: /memory/i });
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("2 files")).toBeInTheDocument();
    expect(screen.getByTestId("admin-song-drawer")).toHaveClass("max-h-0");

    await user.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("admin-song-drawer")).not.toHaveClass("max-h-0");
    // Inside: the song actions and its files
    expect(screen.getByRole("button", { name: /rename/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /archive/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Audio · Tenors · 3.0 MB")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add file/i })
    ).toBeInTheDocument();

    await user.click(header);
    expect(screen.getByTestId("admin-song-drawer")).toHaveClass("max-h-0");
  });
});

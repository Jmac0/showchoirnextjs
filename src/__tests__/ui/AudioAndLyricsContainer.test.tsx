import { render, screen } from "@testing-library/react";

import { AudioAndLyricsContainer } from "@/src/components/members/AudioAndLyricsContainer";
import { localMusicData } from "@/src/devData/localMusicData";
// use only the first set of data from local
const testData = localMusicData[0];
describe("AudioAndLyricsContainer", () => {
  it("Should render the component and its children correctly", () => {
    render(
      <AudioAndLyricsContainer song={testData.song} urls={testData.urls} />
    );
    expect(screen.getByRole("heading", { name: "Memory" }));
    expect(screen.getAllByRole("link")).toHaveLength(7);
    expect(screen.getAllByTestId("audio-player")).toHaveLength(5);

    // expect the draw element to be initially hidden
    const audioDraw = screen.getAllByTestId("audio-draw");
    audioDraw.forEach((el) => expect(el).toHaveClass("overflow-hidden"));
  });
});

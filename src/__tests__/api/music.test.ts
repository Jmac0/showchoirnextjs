/** @jest-environment node */
import { safeFileName, storageEndpointFor, trackKey } from "@/src/lib/music";
import { uploadProblem } from "@/src/lib/musicShared";

describe("Music & Lyrics upload rules", () => {
  it("Should accept MP3/M4A/WAV audio and PDF lyrics or sheet music", () => {
    expect(uploadProblem("audio", "audio/mpeg", 1000)).toBeNull();
    expect(uploadProblem("audio", "audio/mp4", 1000)).toBeNull();
    expect(uploadProblem("audio", "audio/wav", 1000)).toBeNull();
    expect(uploadProblem("lyrics", "application/pdf", 1000)).toBeNull();
    expect(uploadProblem("sheet_music", "application/pdf", 1000)).toBeNull();
  });

  it("Should reject the wrong type, empty files and files that are too big", () => {
    expect(uploadProblem("audio", "application/pdf", 1000)).toMatch(/mp3/i);
    expect(uploadProblem("lyrics", "audio/mpeg", 1000)).toMatch(/pdf/i);
    expect(uploadProblem("audio", "audio/mpeg", 0)).toMatch(/empty/i);
    expect(uploadProblem("audio", "audio/mpeg", 60 * 1024 * 1024)).toMatch(
      /too big.*50 MB/i
    );
    expect(
      uploadProblem("lyrics", "application/pdf", 25 * 1024 * 1024)
    ).toMatch(/20 MB/);
  });
});

describe("Music & Lyrics file keys", () => {
  it("Should make file names safe for storage keys and links", () => {
    expect(safeFileName("My Song (final) v2.MP3")).toBe("my-song-final-v2.mp3");
    expect(safeFileName("Do Re Mi – Sopranos.m4a")).toBe(
      "do-re-mi-sopranos.m4a"
    );
    // A name can't climb out of its folder in storage
    const sneaky = safeFileName("../../etc/passwd");
    expect(sneaky).not.toMatch(/\//);
    expect(sneaky).not.toMatch(/\.\./);
  });

  it("Should put each file under its song and track", () => {
    expect(trackKey("song1", "track1", "Memory Tenors.mp3")).toBe(
      "songs/song1/track1-memory-tenors.mp3"
    );
  });
});

describe("Storage address for signed links (local MinIO)", () => {
  const original = process.env.R2_ENDPOINT;
  afterEach(() => {
    process.env.R2_ENDPOINT = original;
  });

  it("Should use this computer's network address for requests from a phone", () => {
    process.env.R2_ENDPOINT = "http://localhost:9000";
    expect(storageEndpointFor("192.168.0.94:3000")).toBe(
      "http://192.168.0.94:9000"
    );
    expect(storageEndpointFor("localhost:3000")).toBe("http://localhost:9000");
  });

  it("Should leave a real (non-local) storage address alone", () => {
    process.env.R2_ENDPOINT = "https://abc.r2.cloudflarestorage.com";
    expect(storageEndpointFor("192.168.0.94:3000")).toBe(
      "https://abc.r2.cloudflarestorage.com"
    );
  });
});

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import dbConnect from "@/src/lib/dbConnect";
import Songs, { TrackType } from "@/src/lib/models/song";
import { AdminSong, MemberSong, VOICE_PARTS } from "@/src/lib/musicShared";

// Music & Lyrics files - SERVER ONLY (uses the storage keys).
//
// Files live in a private Cloudflare R2 bucket; everything about them (song,
// part, label, file key) is in MongoDB (models/song.ts). So:
//  - the song list comes from MongoDB, never from listing R2 (listing is a
//    paid "Class A" operation, and would happen every time a member opened it)
//  - links are signed here on the server - that's free, no request to R2
//
// Settings (.env.local / the server's env):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
//   R2_ENDPOINT - optional; set to http://localhost:9000 for local MinIO
//                 (`npm run minio`), which stands in for R2 in development

// How long links members get stay valid. Pages/app fetch fresh ones each
// time they load, so an hour is plenty.
const MEMBER_LINK_SECONDS = 60 * 60;
// How long an admin has to finish uploading a file
const UPLOAD_LINK_SECONDS = 15 * 60;

const bucket = () => process.env.R2_BUCKET as string;

const defaultEndpoint = () =>
  process.env.R2_ENDPOINT ||
  `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// One client per storage address (normally just the one)
const clients = new Map<string, S3Client>();
export function r2Client(endpoint = defaultEndpoint()) {
  let client = clients.get(endpoint);
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint,
      // MinIO needs bucket-in-the-path URLs; works for R2 too
      forcePathStyle: !!process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    });
    clients.set(endpoint, client);
  }
  return client;
}

// Local development only: links signed for http://localhost:9000 (MinIO)
// don't work on a phone - there "localhost" is the phone itself. So when
// storage is on localhost and the request came from another device (e.g.
// the app, at http://192.168.0.94:3000), sign links for this computer's
// address as that device sees it instead (MinIO listens on all addresses).
// With real R2 (no R2_ENDPOINT, or not localhost) this does nothing.
export function storageEndpointFor(requestHost?: string) {
  const endpoint = defaultEndpoint();
  if (!requestHost || !/\/\/(localhost|127\.0\.0\.1)[:/]/.test(endpoint)) {
    return endpoint;
  }
  const hostname = requestHost.split(":")[0];
  if (hostname === "localhost" || hostname === "127.0.0.1") return endpoint;
  return endpoint.replace(/\/\/(localhost|127\.0\.0\.1)/, `//${hostname}`);
}

// "My Song (final) v2.MP3" -> "my-song-final-v2.mp3" - safe in a URL/key
export function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1) : "";
  const clean = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  return [clean(base) || "file", clean(ext)].filter(Boolean).join(".");
}

// Where a track's file goes: songs/<songId>/<trackId>-<file-name>.
// Never changes, even if the song or track is renamed.
export const trackKey = (songId: string, trackId: string, fileName: string) =>
  `songs/${songId}/${trackId}-${safeFileName(fileName)}`;

// A link the admin's browser uploads the file to directly (so big files
// never pass through the website's server). The browser must send exactly
// this Content-Type and size - they're part of the signature.
export function uploadUrlFor(key: string, contentType: string, size: number) {
  return getSignedUrl(
    r2Client(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    }),
    { expiresIn: UPLOAD_LINK_SECONDS }
  );
}

// Checks an uploaded file arrived; returns its size, or null if it's not there
export async function uploadedSize(key: string) {
  try {
    const head = await r2Client().send(
      new HeadObjectCommand({ Bucket: bucket(), Key: key })
    );
    return head.ContentLength ?? 0;
  } catch {
    return null;
  }
}

// Deletes files from R2 (free on R2). Ignores files that are already gone.
export async function deleteFiles(keys: string[]) {
  if (!keys.length) return;
  await r2Client().send(
    new DeleteObjectsCommand({
      Bucket: bucket(),
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    })
  );
}

// A signed link to a file, valid for an hour. download=true makes the
// browser save it (with its original name) rather than play/show it.
function memberLink(track: TrackType, download: boolean, endpoint: string) {
  return getSignedUrl(
    r2Client(endpoint),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: track.key,
      ...(download
        ? {
            ResponseContentDisposition: `attachment; filename="${safeFileName(
              track.file_name || track.label
            )}"`,
          }
        : {}),
    }),
    { expiresIn: MEMBER_LINK_SECONDS }
  );
}

// Order tracks: audio by voice part (All voices first), then lyrics, then
// sheet music
const partOrder = (track: TrackType) =>
  track.kind === "audio"
    ? VOICE_PARTS.findIndex((part) => part.value === track.part)
    : 100 + (track.kind === "lyrics" ? 0 : 1);

// A song as the admin page sees it (details only, no links)
export function toAdminSong(song: {
  _id: unknown;
  title: string;
  status: "current" | "archived";
  tracks: TrackType[];
}): AdminSong {
  return {
    id: String(song._id),
    title: song.title,
    status: song.status,
    tracks: [...song.tracks]
      .sort((a, b) => partOrder(a) - partOrder(b))
      .map((track) => ({
        id: String(track._id),
        kind: track.kind,
        ...(track.part ? { part: track.part } : {}),
        label: track.label,
        file_name: track.file_name,
        size: track.size,
        uploaded_at: new Date(track.uploaded_at).toISOString(),
      })),
  };
}

// The songs for members (website Music & Lyrics page and the app), with
// signed links. Current songs first, then archived; A-Z within each.
// requestHost: the Host the request came in on (req.headers.host) - only
// matters in local development, see storageEndpointFor.
export async function songsForMembers({
  includeArchived = true,
  requestHost,
}: {
  includeArchived?: boolean;
  requestHost?: string;
} = {}): Promise<MemberSong[]> {
  const endpoint = storageEndpointFor(requestHost);
  await dbConnect();
  const songs = await Songs.find(includeArchived ? {} : { status: "current" })
    .collation({ locale: "en", strength: 2 })
    .sort({ status: 1, title: 1 }) // "archived" < "current" - fixed below
    .lean();

  const sorted = [
    ...songs.filter((song) => song.status === "current"),
    ...songs.filter((song) => song.status !== "current"),
  ];

  return Promise.all(
    sorted.map(async (song) => ({
      id: String(song._id),
      title: song.title,
      status: song.status,
      tracks: await Promise.all(
        [...(song.tracks as TrackType[])]
          .sort((a, b) => partOrder(a) - partOrder(b))
          .map(async (track) => ({
            id: String(track._id),
            kind: track.kind,
            ...(track.part ? { part: track.part } : {}),
            label: track.label,
            url: await memberLink(track, false, endpoint),
            download_url: await memberLink(track, true, endpoint),
          }))
      ),
    }))
  );
}

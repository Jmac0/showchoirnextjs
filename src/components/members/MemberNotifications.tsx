import { faInfoCircle, faMapPin } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { AppDownloadMessage } from "@/src/components/members/AppDownloadMessage";
import {
  AnnouncementRow,
  formatAnnouncementDate,
} from "@/src/lib/announcementsShared";

// The dashboard's Announcements - the admins' notice board (written on the
// admin "Announcements" page or in the app). They arrive already in order:
// pinned first, then newest (lib/announcements.ts).
export function MemberNotifications({
  announcements,
}: {
  announcements: AnnouncementRow[];
}) {
  return (
    <div className="mx-10 flex w-full flex-col items-center overflow-y-scroll py-5">
      {/* "Get the app" - until they dismiss it */}
      <AppDownloadMessage />
      <h1 className="mb-6">Announcements</h1>
      {announcements.length === 0 && (
        <p className="italic">No announcements yet</p>
      )}
      {announcements.map((announcement) => (
        <div
          data-testid="notification"
          key={announcement.id}
          className="mb-10 flex w-full max-w-4xl flex-col rounded-sm border-2 border-solid border-lightGold bg-stone-100 p-0 text-center md:w-11/12"
        >
          <div className="flex bg-gradient-to-br from-yellow-200 to-yellow-500 text-center">
            <FontAwesomeIcon className="p-1" size="2xl" icon={faInfoCircle} />
            <h2 className="flex-1 p-1 text-center text-black">
              {announcement.title}
            </h2>
            {/* show pin icon if the announcement is pinned */}
            {announcement.pinned && (
              <FontAwesomeIcon
                className="self-end p-1"
                size="2xl"
                icon={faMapPin}
                aria-label="Pinned"
              />
            )}
          </div>
          <h3 className="text-gray-950">
            {formatAnnouncementDate(announcement.created_at)}
          </h3>
          {/* whitespace-pre-line keeps the admin's line breaks */}
          <p className="whitespace-pre-line px-6 pb-3 text-left text-gray-950">
            {announcement.message}
          </p>
        </div>
      ))}
    </div>
  );
}

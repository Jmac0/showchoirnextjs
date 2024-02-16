import { faInfoCircle, faMapPin } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { NotificationType } from "@/src/types/types";

interface NotificationsProps {
  notifications: {
    items: {
      fields: NotificationType;
    }[];
  };
}
export function MemberNotifications({ notifications }: NotificationsProps) {
  const { items } = notifications;
  const notificationsArray = items.map(({ fields }) => {
    const date = new Date(fields.date).toDateString();
    return (
      <div
        data-testid="notification"
        key={fields.title}
        className="mb-10 flex w-full max-w-4xl flex-col rounded-sm border-2 border-solid border-lightGold bg-stone-100 p-0 text-center md:w-11/12"
      >
        <div className="flex bg-gradient-to-br from-yellow-200 to-yellow-500 text-center">
          <FontAwesomeIcon className="p-1" size="2xl" icon={faInfoCircle} />
          <h2 className="flex-1 p-1 text-center text-black">{fields.title}</h2>
          {/* show pin icon if notification is pinned */}
          {fields.pinned && (
            <FontAwesomeIcon
              className="self-end p-1"
              size="2xl"
              icon={faMapPin}
            />
          )}
        </div>
        <h3 className="text-gray-950">{date}</h3>
        <p className="px-6 pb-3 text-left text-gray-950">{fields.details}</p>
      </div>
    );
  });
  return (
    <div className="mx-10 flex w-full flex-col items-center">
      <h1 className="mb-6">Notifications</h1>
      {notificationsArray}
    </div>
  );
}

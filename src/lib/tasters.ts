import { getVenueData } from "@/src/lib/contentfulClient";
import TasterBookings from "@/src/lib/models/tasterBooking";
import { ukDate } from "@/src/lib/ukDate";
import { choirName } from "@/src/lib/venues";

/* Taster bookings for the app's GA "Taster bookings" screen (server only;
the caller must have connected to the database).

The "Book a taster" form only asks which choir, so a choir's list shows its
bookings from the last LIST_WEEKS that haven't come yet, plus anyone checked
in at today's rehearsal there. Older no-shows drop off on their own. */

export const LIST_WEEKS = 8;

// Escapes text for an exact, case-insensitive match
const exactly = (text: string) =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

// The form's choir name ("Dorking") for an app venue slug ("dorking"), from
// the same Contentful venues - or null if the slug isn't a venue
export async function choirForVenue(slug: string) {
  const { items } = await getVenueData();
  const venue = items.find((item) => item.fields.slug === slug);
  return venue ? choirName(venue.fields.location) : null;
}

export type TasterListEntry = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  booked_at: string;
  // Checked in at today's rehearsal here: when
  attended_at: string | null;
};

export async function tasterListFor(slug: string, now = new Date()) {
  const choir = await choirForVenue(slug);
  if (!choir) return null;
  const since = new Date(now.getTime() - LIST_WEEKS * 7 * 24 * 60 * 60 * 1000);
  const today = ukDate(now);

  const bookings = await TasterBookings.find({
    $or: [
      // Booked for this choir recently, not come yet
      {
        choir: exactly(choir),
        booked_at: { $gte: since },
        attended_at: null,
      },
      // Checked in at today's rehearsal here
      { attended_venue: slug, attended_date: today },
    ],
  })
    .sort({ booked_at: -1 })
    .lean();

  return {
    choir,
    bookings: bookings.map(
      (booking): TasterListEntry => ({
        id: String(booking._id),
        first_name: booking.first_name,
        last_name: booking.last_name,
        email: booking.email,
        booked_at: booking.booked_at.toISOString(),
        attended_at: booking.attended_at
          ? booking.attended_at.toISOString()
          : null,
      })
    ),
  };
}

// Saves a taster booking from the form. Booking the same choir again (not
// having come yet) updates the existing booking instead of adding another.
export async function saveTasterBooking(details: {
  firstName: string;
  lastName: string;
  email: string;
  location: string;
}) {
  const email = String(details.email).toLowerCase().trim();
  const choir = String(details.location).trim();
  await TasterBookings.findOneAndUpdate(
    {
      email,
      choir: exactly(choir),
      attended_at: null,
    },
    {
      first_name: String(details.firstName).trim(),
      last_name: String(details.lastName).trim(),
      email,
      choir,
      booked_at: new Date(),
    },
    { upsert: true }
  );
}

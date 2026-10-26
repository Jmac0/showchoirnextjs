import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import { ChoirOptions } from "@/src/components/forms/ChoirOptions";
import { CurrentHolidayBanner } from "@/src/components/HolidayBanner";
import { LoadingButton } from "@/src/components/LoadingButton";
import { SparkleBurst } from "@/src/components/SparkleBurst";
import { UserMessage } from "@/src/components/UserMessage";
import useHttp from "@/src/hooks/useHttp";
import { choirName } from "@/src/lib/venues";
import { VenueType } from "@/src/types/types";

type Props = {
  className?: string;
  venues: VenueType[];
  // choir to pre-select, as a dropdown value (lib/venues.ts choirName) -
  // e.g. on a venue's own page
  defaultChoir?: string;
};

// renders paragraphs as spans (not <p>) so the address text isn't overridden
// by the global `p { text-gray-300; leading-7 }` rule in global.css
const addressFormatOptions = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: (_node: unknown, children: React.ReactNode) => (
      <span className="block">{children}</span>
    ),
  },
};

const BookTasterFrom: React.FC<Props> = ({
  className = "",
  venues = [],
  defaultChoir = "",
}) => {
  const schema = yup
    .object()
    .shape({
      firstName: yup
        .string()
        .required("Please enter your first name")
        .min(3, "First name be at least 3 characters long"),
      lastName: yup
        .string()
        .required("Please enter your last name")
        .min(3, "Last name must be at least 3 characters long")
        /* compare first and last name fields */
        .test(
          "match",
          "First and last names can't be the same",
          // eslint-disable-next-line func-names
          function (lastName) {
            // eslint-disable-next-line react/no-this-in-sfc
            return lastName !== this.parent.firstName;
          }
        ),
      email: yup
        .string()
        .lowercase()
        .required("Please enter your email")
        .email("Please check your email address"),

      location: yup.string().required("Please choose a choir"),
      // honeypot field - real users never see or fill this in,
      // so any submission with it populated is almost certainly a bot
      company: yup.string(),
    })
    .required();

  type FormValues = {
    firstName: string;
    lastName: string;
    email: string;
    location: string;
    company: string | undefined;
  };

  // destructure values from useHttp
  const {
    loading,
    message,
    setLoading,
    sendRequest,
    showUserMessage,
    isErrorMessage,
    responseData,
  } = useHttp({
    url: "/api/mailchimp/bookTasterSession",
    method: "POST",
    withCredentials: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitSuccessful },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      location: defaultChoir,
      company: "",
    },
  });

  // find the full venue record matching the currently selected location,
  // so its day/time/address can be shown below the dropdown.
  // Contentful's location field is "Show Choir <town>" while the dropdown
  // options are just the town name (see lib/venues.ts choirName)
  const selectedLocation = watch("location");
  const selectedVenue = selectedLocation
    ? venues.find((venue) => choirName(venue.location) === selectedLocation)
    : undefined;

  // when the form appeared - the API refuses anything sent faster than a
  // person could fill it in (bots submit instantly)
  const shownAt = useRef(Date.now());

  const submitForm = async (data: FormValues) => {
    setLoading(true);
    await sendRequest({ ...data, elapsed_ms: Date.now() - shownAt.current });
    return () => {
      setLoading(false);
    };
  };
  // a little fanfare when a booking goes through: responseData is set
  // once per finished request, so each successful booking bursts again
  const [sparkleBurst, setSparkleBurst] = useState(0);
  useEffect(() => {
    if (responseData && !isErrorMessage) {
      setSparkleBurst((burst) => burst + 1);
    }
  }, [responseData, isErrorMessage]);

  useEffect(() => {
    if (!isErrorMessage) {
      // this also runs when the form first appears, so it must keep the
      // pre-selected choir rather than clearing it
      reset({
        firstName: "",
        lastName: "",
        email: "",
        location: defaultChoir,
        company: "",
      });
    }
  }, [reset, isErrorMessage, isSubmitSuccessful, defaultChoir]);
  return (
    <form
      className={`mb-8 flex w-full  flex-col items-center justify-evenly rounded-md border-2 border-lightGold  bg-gradient-to-br from-lightBlack/75 to-black/75 p-5 text-gray-50 ${className}`}
      onSubmit={handleSubmit(submitForm)}
    >
      {/* honeypot field - hidden from sighted users and skipped by
       screen readers/keyboard tabbing, but visible to naive bots that
       fill in every input */}
      <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          type="text"
          id="company"
          tabIndex={-1}
          autoComplete="off"
          {...register("company")}
        />
      </div>
      <h2 className="self-center p-0 md:mb-3 ">
        Book Your Free Taster Session
      </h2>
      <h3 className="self-center">
        Or call Angela on{" "}
        <a className="text-yellow-50" href="tel:07957 928099">
          {" "}
          07957 928099
        </a>
      </h3>
      <div className="flex w-full flex-col items-center">
        {/* one column for the banner and the fields, so they line up */}
        <div className="flex w-full max-w-md flex-col">
          {/* Only while a holiday is on (admin "Holidays" page) */}
          <CurrentHolidayBanner className="w-full" />
          <div className="flex w-full flex-col items-center">
            <div className="flex w-full min-w-0 flex-col">
              <label className="w-32 pt-3" htmlFor="firstName">
                First name *
              </label>
              <span className="mb-0.5 h-4 md:h-5">
                {errors.firstName && (
                  <span
                    role="alert"
                    className="mt-0.5 flex text-xs text-red-400 "
                  >
                    {errors.firstName.message}
                  </span>
                )}
              </span>
              <input
                className="w-full rounded py-2 pl-2 text-base text-black"
                type="text"
                id="firstName"
                {...register("firstName")}
              />
            </div>
          </div>

          <div className="flex w-full flex-col items-center">
            <div className="flex w-full min-w-0 flex-col">
              <label className="w-32 pt-3" htmlFor="lastName">
                Last name *
              </label>
              <span className="mb-0.5 h-4 md:h-5">
                {errors.lastName && (
                  <span
                    role="alert"
                    className="mt-0.5 flex text-xs text-red-400 "
                  >
                    {errors.lastName.message}
                  </span>
                )}
              </span>
              <input
                className="w-full rounded py-2 pl-2 text-base text-black"
                type="text"
                id="lastName"
                {...register("lastName")}
              />
            </div>
          </div>

          <div className="flex w-full flex-col items-center">
            <div className="flex w-full min-w-0 flex-col">
              <label className="w-32 pt-3" htmlFor="email">
                Email *
              </label>
              <span className="mb-0.5 h-4 md:h-5">
                {errors.email && (
                  <span
                    role="alert"
                    className="mt-0.5 flex text-xs text-red-400 "
                  >
                    {errors.email.message}
                  </span>
                )}
              </span>

              <input
                className="w-full rounded py-2 pl-2 text-base text-black"
                type="text"
                id="email"
                {...register("email")}
              />
            </div>
          </div>
          <div className="flex w-full flex-col items-center">
            <div className="mb-3 flex w-full min-w-0 flex-col">
              <label className="w-32 pt-3" htmlFor="location">
                Location *
              </label>
              <span className="mb-0.5 h-4 md:h-5">
                {errors.location && (
                  <span
                    role="alert"
                    className="mt-0.5 flex text-xs text-red-400 "
                  >
                    {errors.location.message}
                  </span>
                )}
              </span>
              <div className="relative w-full">
                <select
                  className="w-full appearance-none rounded py-2 pl-2 pr-8 text-base text-black"
                  id="location"
                  {...register("location", {})}
                >
                  {/* The choirs from Contentful - same list as the sign-up form */}
                  <ChoirOptions venues={venues} />
                </select>
                <svg
                  className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-black"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* venue details - only shown once a choir has been chosen */}
      {selectedVenue && (
        <div className="my-3 flex h-52 w-full flex-col items-center justify-center rounded-md border border-lightGold bg-slate-400/20 p-3 text-sm text-gray-100">
          <h2 className="m-0 p-0 font-semibold">
            {choirName(selectedVenue.location)} Choir
          </h2>
          <address className="content-center text-center font-bold not-italic leading-snug">
            {selectedVenue.choirDayOfWeek} {selectedVenue.time}
            {documentToReactComponents(
              selectedVenue.address,
              addressFormatOptions
            )}
          </address>
        </div>
      )}
      <LoadingButton disabled={false} text="Book Now" loading={loading}>
        <SparkleBurst burst={sparkleBurst} />
      </LoadingButton>
      {/*
       Show the User message component if there is a message
       */}
      {showUserMessage && (
        <UserMessage
          message={message}
          isError={isErrorMessage}
          showMessage={showUserMessage}
        />
      )}
    </form>
  );
};

export default BookTasterFrom;

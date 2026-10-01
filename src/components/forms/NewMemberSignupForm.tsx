import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

// import { counties } from "../../lib/countyList";
import { ChoirOptions } from "@/src/components/forms/ChoirOptions";
import { LoadingButton } from "@/src/components/LoadingButton";
import { UserMessage } from "@/src/components/UserMessage";
import { FULL_PRICE_PRODUCT } from "@/src/lib/stripe/flexiProducts";
import { ChoirVenue } from "@/src/lib/venues";

/* Validate phone number regex */
const phoneRegEx =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\(\d{2,3}\\)[ \\-]*)|(\d{2,4})[ \\-]*)*?\d{3,4}?[ \\-]*\d{3,4}?$/;

/* Validate post code regex */
const postCodeRegex = /^[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}$/i;
/* form validation schema */
const schema = yup
  .object()
  .shape({
    firstName: yup
      .string()
      .required("Please enter your first name")
      .min(3, "MUST be at least 3 characters long"),
    lastName: yup
      .string()
      .required("Please enter your last name")
      .min(3, "MUST be at least 3 characters long")
      /* compare  first and last name fields */
      .test(
        "match",
        "First and last names can't be the same",
        function compareNames(lastName) {
          return lastName !== this.parent.firstName;
        }
      ),
    streetAddress: yup
      .string()
      .required("Please enter your street address")
      .min(3, "MUST be at least 3 characters long"),
    townOrCity: yup
      .string()
      .required("Please enter your town")
      .min(3, "MUST be at least 3 characters long"),
    county: yup
      .string()
      .lowercase()
      .required("Please enter your county")
      .min(3, "MUST be at least 3 characters long"),
    postCode: yup
      .string()
      .matches(postCodeRegex, "Please enter a valid post code")
      .required("Please enter your post code"),
    phoneNumber: yup
      .string()
      .matches(phoneRegEx, "Please enter a valid phone number")
      .required("Please enter your contact number"),
    email: yup
      .string()
      .lowercase()
      .required("Please enter your email")
      .email("Please check your email address"),
    homeChoir: yup.string().required("Please choose your home choir"),
    ageConfirm: yup
      .boolean()
      .oneOf([true], "Please confirm your age")
      .required(),
    consent: yup
      .boolean()
      .oneOf([true], "Please check the box to agree")
      .required("Please confirm your age"),
  })
  .required();
// infer types from yup schema
export type NewMemberFormData = yup.InferType<typeof schema>;

// Stretches an element across the whole form card, undoing the form's
// lg:pl-52 left padding, so centred content is centred on the card on desktop
// (13rem = pl-52). self-stretch fills the width; -ml-52 extends it left.
const FULL_WIDTH = "self-stretch lg:-ml-52";

type Props = {
  loading: boolean;
  submitForm: (data: NewMemberFormData) => Promise<void>;
  message: string;
  isErrorMessage: boolean;
  showUserMessage: boolean;
  showFlexiOptions: boolean;
  // The choirs for "Choose a choir", from Contentful (see lib/venues.ts)
  venues: ChoirVenue[];
};

export function NewMemberSignUpForm({
  submitForm,
  loading,
  isErrorMessage,
  message,
  showUserMessage,
  showFlexiOptions,
  venues,
}: Props) {
  // register form fields for yup validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewMemberFormData>({
    resolver: yupResolver(schema),
  });

  return (
    <div className="my-10 flex flex-col items-center py-1 md:w-3/4 ">
      {/* lg:pl-52 lines the fields up with their labels on desktop. Things
          that should be centred on the whole card (heading, price, payment
          note, Next button, message) use FULL_WIDTH to undo that left padding,
          otherwise they sit off to the right. */}
      <form
        onSubmit={handleSubmit(submitForm)}
        className="flex flex-col space-y-2 rounded-md border-2 border-lightGold bg-gradient-to-br from-lightBlack/75 to-black/75 p-3 text-gray-300 lg:pl-52 "
      >
        <h2 className={`${FULL_WIDTH} text-center`}>Join The Fun!</h2>
        <div className="flex flex-col md:flex-row">
          <label className="mt-4 w-32" htmlFor="first_name">
            First name *
          </label>

          <div className="flex w-full flex-col md:w-9/12 ">
            <div className="mb-0.5 md:h-5">
              {errors.firstName && (
                <span role="alert" className="flex text-xs text-red-400 ">
                  {errors.firstName.message}
                </span>
              )}
            </div>
            <input
              className="w-full rounded py-2 pl-2 text-base text-black md:w-2/3"
              type="text"
              id="first_name"
              {...register("firstName")}
            />
          </div>
        </div>

        <div className="  flex flex-col md:flex-row">
          <label className="mt-4 w-32" htmlFor="last_name">
            Last name *
          </label>

          <div className="flex w-full flex-col md:w-9/12">
            <div className="mb-0.5 md:h-5">
              {errors.lastName && (
                <span role="alert" className="flex text-xs text-red-400 ">
                  {errors.lastName.message}
                </span>
              )}
            </div>
            <input
              className="w-full rounded py-2 pl-2 text-base text-black md:w-2/3"
              type="text"
              id="last_name"
              {...register("lastName")}
            />
          </div>
        </div>

        <div className="my-2 flex flex-col md:flex-row">
          <label className="mt-4 w-32" htmlFor="street_address">
            Street address *
          </label>

          <div className="flex w-full flex-col md:w-9/12">
            <div className="mb-0.5 md:h-5">
              {errors.streetAddress && (
                <span role="alert" className="flex text-xs text-red-400 ">
                  {errors.streetAddress.message}
                </span>
              )}
            </div>

            <input
              className="w-full rounded py-2 pl-2 text-base text-black md:w-2/3"
              type="text"
              id="street_address"
              {...register("streetAddress", {
                required: "Street address is required",
              })}
            />
          </div>
        </div>

        <div className="my-2 flex flex-col md:flex-row">
          <label className="mt-4 w-32" htmlFor="town_city">
            Town/City *
          </label>
          <div className="flex w-full flex-col md:w-9/12">
            <div className="mb-0.5 md:h-5">
              {errors.townOrCity && (
                <span role="alert" className="flex text-xs text-red-400 ">
                  {errors.townOrCity.message}
                </span>
              )}
            </div>

            <input
              autoCapitalize="word"
              className="w-full rounded py-2 pl-2 text-base text-black md:w-2/3"
              type="text"
              id="town_city"
              {...register("townOrCity")}
            />
          </div>
        </div>

        <div className="my-2 flex flex-col md:flex-row">
          <label className="mt-4 w-32" htmlFor="county">
            County *
          </label>

          <div className="flex w-full flex-col md:w-9/12">
            <div className="mb-0.5 md:h-5">
              {errors.county && (
                <span role="alert" className="flex text-xs text-red-400 ">
                  {errors.county.message}
                </span>
              )}
            </div>

            <input
              autoCapitalize="sentences"
              className="w-full rounded py-2 pl-2 text-base text-black md:w-2/3"
              type="text"
              id="county"
              {...register("county")}
            />
          </div>
        </div>

        <div className="my-2 flex flex-col md:flex-row">
          <label className="mt-4 w-32" htmlFor="post_code">
            Post Code *
          </label>

          <div className="flex w-full flex-col md:w-9/12">
            <div className="mb-0.5 md:h-5">
              {errors.postCode && (
                <span role="alert" className="flex text-xs text-red-400 ">
                  {errors.postCode.message}
                </span>
              )}
            </div>

            <input
              className="w-full rounded py-2 pl-2 text-base text-black md:w-2/3"
              type="text"
              id="post_code"
              {...register("postCode")}
            />
          </div>
        </div>

        <div className="my-2 flex flex-col md:flex-row">
          <label className="mt-4 w-32" htmlFor="phone_number">
            Phone Number *
          </label>

          <div className="flex w-full flex-col md:w-9/12">
            <div className="mb-0.5 md:h-5">
              {errors.phoneNumber && (
                <span role="alert" className="flex text-xs text-red-400 ">
                  {errors.phoneNumber.message}
                </span>
              )}
            </div>

            <input
              className="w-full rounded py-2 pl-2 text-base text-black md:w-2/3"
              type="number"
              id="phone_number"
              {...register("phoneNumber")}
            />
          </div>
        </div>

        <div className="my-2 flex flex-col pb-4 md:flex-row">
          <label className="mt-4 w-32" htmlFor="email">
            Email : *
          </label>

          <div className="flex w-full flex-col md:w-9/12">
            <div className="mb-0.5 md:h-5">
              {errors.email && (
                <span role="alert" className="flex text-xs text-red-400 ">
                  {errors.email.message}
                </span>
              )}
            </div>

            <input
              className="w-full rounded py-2 pl-2 text-base text-black md:w-2/3"
              type="email"
              id="email"
              {...register("email")}
            />
          </div>
        </div>

        {/* Price, on the flexi membership page only. New members always pay
            the full price - concession is no longer offered to new members
            (existing concession members keep it, see lib/stripe/flexiProducts.ts) */}
        {showFlexiOptions && (
          <h2
            className={`${FULL_WIDTH} pb-4 text-center`}
          >{`£${FULL_PRICE_PRODUCT.price} for 10 sessions`}</h2>
        )}
        <p className="text-s border-r-12 rounded-lg bg-slate-100 p-2 text-slate-800 md:ml-32 md:w-1/2">
          At Show Choir you can attend any choir any time, but we ask you to
          choose a home choir, so we can update you about any venue changes &
          deliver any products to your home choir for you to pick up.
        </p>

        <div className="my-2 flex flex-col md:flex-row">
          <label className="mt-5 w-32" htmlFor="homeChoir">
            Home Choir *
          </label>

          <div className="flex flex-col">
            <div className="mb-0.5 md:h-5">
              {errors.homeChoir && (
                <span role="alert" className="flex text-xs text-red-400 ">
                  {errors.homeChoir.message}
                </span>
              )}
            </div>
            <select
              className="w-48 rounded py-2 pl-2 text-base text-black"
              id="homeChoir"
              {...register("homeChoir")}
            >
              {/* The choirs from Contentful - same list as Book a taster */}
              <ChoirOptions venues={venues} />
            </select>
          </div>
        </div>

        <div className="items-top my-2 flex flex-row">
          <label className="mt-5 w-28" htmlFor="ageConfirm">
            I am over 18 *
          </label>

          <div className="mx-4 flex flex-col items-start ">
            <div className="h-5">
              {errors.ageConfirm && (
                <span role="alert" className="flex text-xs text-red-400 ">
                  {errors.ageConfirm.message}
                </span>
              )}
            </div>

            <input
              className=" mt-1.5 text-sm text-black "
              type="checkbox"
              id="ageConfirm"
              {...register("ageConfirm")}
            />
          </div>
        </div>

        <div className="my-2 flex flex-col">
          <p className="text-s rounded-lg bg-gray-50 p-2 text-slate-800 md:ml-32  md:w-1/2">
            Please tick the box below to indicate your consent to Show Choir
            holding your data for the reasons given above. This information is
            collected by Show Choir to enable us to provide services to you. It
            will be added to our customer records and will be retained where we
            are legally obliged to do so, we never share your information with
            third parties.
          </p>

          <div className="items-top my-2 flex flex-row">
            <label className="mt-5 w-28 text-gray-300" htmlFor="consent">
              I agree *
            </label>

            <div className="mx-4 flex flex-col items-start ">
              <div className="h-5">
                {errors.consent && (
                  <span role="alert" className="flex text-xs text-red-400 ">
                    {errors.consent.message}
                  </span>
                )}
              </div>

              <input
                className=" mt-1.5 text-sm text-black "
                type="checkbox"
                id="consent"
                {...register("consent")}
              />
            </div>
          </div>
        </div>
        <div
          className={`${FULL_WIDTH} m-0 flex flex-col items-center justify-center`}
        >
          {showFlexiOptions ? (
            <p className="text-s rounded-md border-2 border-lightGold p-3 text-center text-gray-300 md:w-3/4">
              By clicking next you will be redirected to a secure payment page,
              Show Choir does not hold any of your banking or credit card
              information.
            </p>
          ) : (
            <p className="text-s rounded-md border-2 border-lightGold p-3 text-center text-gray-300 md:w-3/4">
              By clicking next you will be redirected to a secure page to setup
              your direct debit. Show Choir does not hold any of your banking
              information.
            </p>
          )}
          <LoadingButton text="Next" disabled={false} loading={loading} />
        </div>
        {showUserMessage && (
          <div className={`${FULL_WIDTH} flex justify-center`}>
            <UserMessage
              isError={isErrorMessage}
              showMessage={showUserMessage}
              message={message}
            />
          </div>
        )}
      </form>
    </div>
  );
}

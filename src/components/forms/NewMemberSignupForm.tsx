import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

// import { counties } from "../../lib/countyList";
import { LoadingButton } from "@/src/components/LoadingButton";
import { UserMessage } from "@/src/components/UserMessage";

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
        function compairNames(lastName) {
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

type Props = {
  loading: boolean;
  submitForm: (data: NewMemberFormData) => Promise<void>;
  message: string;
  isErrorMessage: boolean;
  showUserMessage: boolean;
};

export function NewMemberSignUpForm({
  submitForm,
  loading,
  isErrorMessage,
  message,
  showUserMessage,
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
    <div className="flex flex-col items-center py-1 lg:w-3/4 ">
      <h2>Join The Fun!</h2>
      <form
        onSubmit={handleSubmit(submitForm)}
        className="flex flex-col space-y-2 rounded-md border-2 border-lightGold p-3 text-gray-50 "
      >
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
              className="pl-1 text-sm text-black"
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
              className="pl-1 text-sm text-black"
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
              className=" pl-1 text-sm text-black"
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
              className="pl-1 text-sm text-black"
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
              className="pl-1 text-sm text-black"
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
              className="pl-1 text-sm text-black "
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
              className="pl-1 text-sm text-black"
              type="number"
              id="phone_number"
              {...register("phoneNumber")}
            />
          </div>
        </div>

        <div className="my-2 flex flex-col md:flex-row">
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
              className="pl-1 text-sm text-black"
              type="email"
              id="email"
              {...register("email")}
            />
          </div>
        </div>

        <p className="pt-9 text-xs md:w-1/2">
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
              className="w-48 text-black"
              id="homeChoir"
              {...register("homeChoir")}
            >
              <option value="">Choose a choir</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
              <option value="option4">Option 4</option>
              <option value="option5">Option 5</option>
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
          <p className="text-xs  md:w-1/2">
            Please tick the box below to indicate your consent to Show Choir
            holding your data for the reasons given above. This information is
            collected by Show Choir to enable us to provide services to you. It
            will be added to our customer records and will be retained where we
            are legally obliged to do so, we never share your information with
            third parties.
          </p>

          <div className="items-top my-2 flex flex-row">
            <label className="mt-5 w-28" htmlFor="consent">
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
        <div className="self  m-0 flex flex-col items-center justify-center self-center">
          <p className="rounded-md border-2 border-lightGold p-3 text-center text-xs md:w-3/4">
            By clicking next you will be redirected to a secure page to setup
            your direct debit. Show Choir does not directly hold your banking
            information.
          </p>
          <LoadingButton text="Next" disabled={false} loading={loading} />
        </div>
        {showUserMessage && (
          <UserMessage
            isError={isErrorMessage}
            showMessage={showUserMessage}
            message={message}
          />
        )}
      </form>
    </div>
  );
}

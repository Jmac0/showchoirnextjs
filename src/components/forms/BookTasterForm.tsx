import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import { LoadingButton } from "@/src/components/LoadingButton";
import { UserMessage } from "@/src/components/UserMessage";
import useHttp from "@/src/hooks/useHttp";

type Props = {
  className?: string;
};

const BookTasterFrom: React.FC<Props> = ({ className = "" }) => {
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
          },
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
  } = useHttp({
    url: "/api/mailchimp/bookTasterSession",
    method: "POST",
    withCredentials: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
    },
  });

  const submitForm = async (data: FormValues) => {
    setLoading(true);
    await sendRequest(data);
    return () => {
      setLoading(false);
    };
  };
  useEffect(() => {
    if (!isErrorMessage) {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
      });
    }
  }, [reset, isErrorMessage, isSubmitSuccessful]);
  return (
    <form
      className={`mb-8 flex w-full flex-col justify-evenly rounded-md border-2 border-lightGold bg-gradient-to-br from-lightBlack/75 to-black/75 p-5 text-gray-50 lg:w-1/3 ${className}`}
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
      <div className="flex flex-row items-center">
        <label className="w-32 pt-3" htmlFor="firstName">
          First name *
        </label>

        <div className="flex w-full flex-col md:w-9/12 ">
          <span className=" h-4 md:h-5">
            {errors.firstName && (
              <span role="alert" className="flex text-xs text-red-400 ">
                {errors.firstName.message}
              </span>
            )}
          </span>
          <input
            className="w-full rounded pl-1 text-sm text-black"
            type="text"
            id="firstName"
            {...register("firstName")}
          />
        </div>
      </div>
      <div className="flex flex-row items-center">
        <label className="w-32 pt-3" htmlFor="lastName">
          Last name *
        </label>

        <div className="flex w-full flex-col md:w-9/12 ">
          <span className="mb-0.5 h-4 md:h-5">
            {errors.lastName && (
              <span role="alert" className="mt-0.5 flex text-xs text-red-400 ">
                {errors.lastName.message}
              </span>
            )}
          </span>
          <input
            className="w-full rounded pl-1 text-sm text-black"
            type="text"
            id="lastName"
            {...register("lastName")}
          />
        </div>
      </div>

      <div className="flex items-center ">
        <label className=" w-32 pt-3" htmlFor="email">
          Email *
        </label>

        <div className="flex w-full flex-col md:w-9/12">
          <span className="mb-0.5 h-4 md:h-5">
            {errors.email && (
              <span role="alert" className="mt-0.5 flex text-xs text-red-400 ">
                {errors.email.message}
              </span>
            )}
          </span>

          <input
            className="w-full rounded pl-1 text-sm text-black"
            type="text"
            id="email"
            {...register("email")}
          />
        </div>
      </div>
      <div className="flex items-center">
        <label className="w-32 pt-1" htmlFor="location">
          Location *
        </label>

        <div className="mb-3 flex w-full flex-col md:w-9/12">
          <span className="mb-0.5 h-4 md:h-5">
            {errors.location && (
              <span role="alert" className="mt-0.5 flex text-xs text-red-400 ">
                {errors.location.message}
              </span>
            )}
          </span>
          <select
            className="w-full text-sm text-black"
            id="location"
            {...register("location", {})}
          >
            <option value="">Choose a choir</option>
            <option value="Banstead">Banstead</option>
            <option value="Leatherhead">Leatherhead</option>
            <option value="Dorking">Dorking</option>
            <option value="Cobham">Cobham</option>
            <option value="West Byfleet">West Byfleet</option>
          </select>
        </div>
      </div>
      <LoadingButton disabled={false} text="Book Now" loading={loading} />
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

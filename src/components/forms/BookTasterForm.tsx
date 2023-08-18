import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import { LoadingButton } from "@/src/components/LoadingButton";
import { UserMessage } from "@/src/components/UserMessage";
import useHttp from "@/src/hooks/useHttp";

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
          return lastName !== this.parent.firstName;
        }
      ),
    email: yup
      .string()
      .lowercase()
      .required("Please enter your email")
      .email("Please check your email address"),

    location: yup.string().required("Please choose a choir"),
  })
  .required();

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  location: string;
};

const BookTasterFrom: React.FC = () => {
  // destructure values from useHttp
  const {
    loading,
    message,
    setLoading,
    sendRequest,
    showUserMessage,
    isErrorMessage,
  } = useHttp({
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mailchimp/bookTasterSession`,
    method: "POST",
    withCredentials: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
  });

  const submitForm = async (data: FormValues) => {
    setLoading(true);
    await sendRequest(data);
  };

  return (
    <form
      className="flex w-11/12 flex-col justify-evenly self-center rounded-md border-2 border-lightGold bg-gradient-to-br from-lightBlack/75 to-black/75 p-5 text-gray-50 md:w-2/3 lg:absolute lg:bottom-2 lg:right-10  lg:w-1/3 lg:bg-black/75 "
      onSubmit={handleSubmit(submitForm)}
    >
      <h2 className="self-center p-0 md:mb-3 ">
        Book Your Free Taster Session
      </h2>
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
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
            <option value="option4">Option 4</option>
            <option value="option5">Option 5</option>
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

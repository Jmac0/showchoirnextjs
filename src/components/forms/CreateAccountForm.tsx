import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import { LoadingButton } from "@/src/components/LoadingButton";
import { UserMessage } from "@/src/components/UserMessage";
import useHttp from "@/src/hooks/useHttp";

const schema = yup
  .object()
  .shape({
    password: yup
      .string()
      .required("Please enter a password")
      .min(4, "Password be at least 4 characters long"),
    confirm: yup
      .string()
      .required("Please confirm your password")
      /* compare first and last name fields */
      .test(
        "match",
        "Passwords do not match",
        // eslint-disable-next-line func-names
        function (confirm) {
          return confirm === this.parent.password;
        }
      ),
  })
  .required();

type FormValues = {
  password: string;
  confirm: string;
};

// type CreateAccountFormPropsType = {
//   email?: string | string[] | undefined;
// };

type Props = {
  email?: string;
};
function CreateAccountForm({ email }: Props) {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState("");
  // destructure values from useHttp
  const {
    loading,
    message,
    setLoading,
    responseData,
    sendRequest,
    showUserMessage,
    isErrorMessage,
  } = useHttp({
    url: `/api/signup/createPassword`,
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
    await sendRequest({ ...data, email: userEmail });
  };

  useEffect(() => {
    setUserEmail(email as string);
    if (responseData && responseData.status === 200) {
      router.push("/auth/signin");
    }
  }, [email, responseData, router]);

  return (
    <form
      className="flex w-11/12 flex-col justify-evenly self-center rounded-md border-2
       border-lightGold bg-gradient-to-br from-lightBlack/75 to-black/75 p-5 text-gray-50 md:w-full"
      onSubmit={handleSubmit(submitForm)}
    >
      <h1 className="self-center p-0 md:mb-3 ">Create Account</h1>
      <div className="flex flex-row items-center">
        <label className="w-32 pt-3" htmlFor="email">
          Email
        </label>

        <div className="flex w-full flex-col md:w-9/12 ">
          <input
            className="w-full rounded pl-1 text-sm text-black"
            type="text"
            readOnly
            disabled
            id="email"
            value={userEmail}
          />
        </div>
      </div>
      <div className="flex flex-row items-center">
        <label className="w-32 pt-3" htmlFor="password">
          Password
        </label>

        <div className="flex w-full flex-col md:w-9/12 ">
          <span className="mb-0.5 h-4 md:h-5">
            {errors.password && (
              <span role="alert" className="mt-0.5 flex text-xs text-red-400 ">
                {errors.password.message}
              </span>
            )}
          </span>
          <input
            className="w-full rounded pl-1 text-sm text-black"
            type="text"
            id="password"
            autoCapitalize="none"
            {...register("password")}
          />
        </div>
      </div>

      <div className="flex items-center ">
        <label className=" w-32 pt-3" htmlFor="confirm">
          Confirm Password
        </label>

        <div className="flex w-full flex-col md:w-9/12">
          <span className="mb-0.5 h-4 md:h-5">
            {errors.confirm && (
              <span role="alert" className="mt-0.5 flex text-xs text-red-400 ">
                {errors.confirm.message}
              </span>
            )}
          </span>

          <input
            className="w-full rounded pl-1 text-sm text-black"
            type="text"
            id="confirm"
            autoCapitalize="none"
            {...register("confirm")}
          />
        </div>
      </div>

      <LoadingButton disabled={false} text="Create Account" loading={loading} />
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
}
CreateAccountForm.defaultProps = {
  email: "",
};

export default CreateAccountForm;

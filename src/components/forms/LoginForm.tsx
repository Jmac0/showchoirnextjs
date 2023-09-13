import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import { LoadingButton } from "@/src/components/LoadingButton";
import { UserMessage } from "@/src/components/UserMessage";
// field validation using Yup
const schema = yup
  .object()
  .shape({
    password: yup.string().required("Please enter your password"),

    email: yup
      .string()
      .lowercase()
      .required("Please enter your email")
      .email("Please check your email address"),
  })
  .required();

type FormValues = {
  password: string;
  email: string;
};

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const router = useRouter();
  // react hook form using Yup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
  });

  const submitForm = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (res?.error) {
        setShowMessage(true);
        setMessage("Username or password incorrect");
        setLoading(false);
      } else {
        setLoading(false);
        router.push("/members/dashboard");
      }
    } catch (err: unknown) {
      throw new Error("Auth error occurred");
    }
  };

  return (
    <form
      className="flex w-11/12 flex-col justify-evenly rounded-md border-2 border-lightGold bg-gradient-to-br
       from-lightBlack/75 to-black/75 p-5 text-gray-50 md:w-2/3  lg:bg-black/75 "
      onSubmit={handleSubmit(submitForm)}
    >
      <h2 className="self-center p-0 md:mb-3 ">Login</h2>

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
            autoCapitalize="none"
            // hide message on change
            {...register("email", { onChange: () => setShowMessage(false) })}
          />
        </div>
      </div>
      <div className="mb-5 flex flex-row items-center">
        <label className="w-32 pt-4" htmlFor="firstName">
          Password
        </label>

        <div className="flex w-full flex-col md:w-9/12 ">
          <span className=" h-4 md:h-5">
            {errors.password && (
              <span role="alert" className="flex text-xs text-red-400 ">
                {errors.password.message}
              </span>
            )}
          </span>
          <input
            className="w-full rounded pl-1 text-sm text-black"
            type="text"
            id="password"
            autoCapitalize="none"
            // hide message on change
            {...register("password", {
              onChange: () => setShowMessage(false),
            })}
          />
        </div>
      </div>
      <LoadingButton disabled={false} text="Login" loading={loading} />
      {/*
       Show the User message component if there is an error message
       */}
      <UserMessage message={message} isError showMessage={showMessage} />
    </form>
  );
};

export default LoginForm;

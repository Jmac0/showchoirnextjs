import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import { LoadingButton } from "@/src/components/LoadingButton";
import { UserMessage } from "@/src/components/UserMessage";
import useHttp from "@/src/hooks/useHttp";
import { LINK_MESSAGE, LINK_PATTERN } from "@/src/lib/helpers/formSpamShared";
import {
  isPostcodeArea,
  isUkPhone,
  MAX_EXPERIENCE_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_TOWN_LENGTH,
  MIN_EXPERIENCE_LENGTH,
} from "@/src/lib/helpers/leaderApplicationShared";

// spam bots almost always include links, so the API refuses them - say so
// here first so a real person can fix their application
const noLinks = (value?: string) => !value || !LINK_PATTERN.test(value);

type FormValues = {
  name: string;
  phone: string;
  email: string;
  town: string;
  postcode: string;
  experience: string;
  company: string | undefined;
};

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  town: "",
  postcode: "",
  experience: "",
};

const schema = yup
  .object()
  .shape({
    name: yup
      .string()
      .trim()
      .required("Please enter your name")
      .min(2, "Please enter your name")
      .max(MAX_FULL_NAME_LENGTH, "Name is too long")
      .test("no-links", LINK_MESSAGE, noLinks),
    phone: yup
      .string()
      .required("Please enter your phone number")
      .test("uk-phone", "Please enter a UK phone number", (value) =>
        isUkPhone(value ?? "")
      ),
    email: yup
      .string()
      .trim()
      .lowercase()
      .required("Please enter your email")
      .email("Please check your email address"),
    town: yup
      .string()
      .trim()
      .required("Please enter your town")
      .max(MAX_TOWN_LENGTH, "Town is too long")
      .test("no-links", LINK_MESSAGE, noLinks),
    postcode: yup
      .string()
      .required("Please enter your postcode area")
      .test("postcode", "Just the first part, e.g. KT12", (value) =>
        isPostcodeArea(value ?? "")
      ),
    experience: yup
      .string()
      .trim()
      .required("Please tell us about your experience")
      .min(
        MIN_EXPERIENCE_LENGTH,
        "Please tell us a bit more about your experience"
      )
      .max(
        MAX_EXPERIENCE_LENGTH,
        `Please keep this under ${MAX_EXPERIENCE_LENGTH} characters`
      )
      .test("no-links", LINK_MESSAGE, noLinks),
    // honeypot field - real users never see or fill this in,
    // so any submission with it populated is almost certainly a bot
    company: yup.string(),
  })
  .required();

// One labelled input with its error message above, like the Contact form
type FieldProps = {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
};
function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="flex flex-row items-center">
      <label className="w-32 shrink-0 pt-3" htmlFor={id}>
        {label}
      </label>
      <div className="flex w-full flex-col md:w-9/12">
        <span className="mb-0.5 h-4 md:h-5">
          {error && (
            <span role="alert" className="mt-0.5 flex text-xs text-red-400">
              {error}
            </span>
          )}
        </span>
        {children}
      </div>
    </div>
  );
}
Field.defaultProps = { error: undefined };

const inputClass = "w-full rounded pl-1 text-sm text-black";

// Application form for the choir leader job (Work with us page)
const LeaderApplicationForm: React.FC = () => {
  const {
    loading,
    message,
    setLoading,
    sendRequest,
    showUserMessage,
    isErrorMessage,
  } = useHttp({
    url: "/api/handleLeaderApplication",
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
    defaultValues: { ...emptyForm, company: "" },
  });

  // when the form appeared - the API refuses anything sent faster than a
  // person could type it (bots submit instantly)
  const shownAt = useRef(Date.now());

  const submitForm = async (data: FormValues) => {
    setLoading(true);
    await sendRequest({ ...data, elapsed_ms: Date.now() - shownAt.current });
  };
  useEffect(() => {
    if (!isErrorMessage) reset(emptyForm);
  }, [reset, isErrorMessage, isSubmitSuccessful]);

  return (
    <form
      className="flex w-full flex-col justify-evenly rounded-md border-2 border-lightGold bg-gradient-to-br from-lightBlack/75 to-black/75 p-5 text-gray-50"
      onSubmit={handleSubmit(submitForm)}
    >
      {/* honeypot field - hidden from sighted users and skipped by
       screen readers/keyboard tabbing, but visible to naive bots that
       fill in every input */}
      <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
        <label htmlFor="leader-company">Company</label>
        <input
          type="text"
          id="leader-company"
          tabIndex={-1}
          autoComplete="off"
          {...register("company")}
        />
      </div>
      <h1 className="self-center p-0 md:mb-3">Apply to lead a choir</h1>

      <Field id="leader-name" label="Name *" error={errors.name?.message}>
        <input
          className={inputClass}
          type="text"
          id="leader-name"
          autoComplete="name"
          {...register("name")}
        />
      </Field>
      <Field
        id="leader-phone"
        label="Phone number *"
        error={errors.phone?.message}
      >
        <input
          className={inputClass}
          type="tel"
          id="leader-phone"
          autoComplete="tel"
          {...register("phone")}
        />
      </Field>
      <Field id="leader-email" label="Email *" error={errors.email?.message}>
        <input
          className={inputClass}
          type="email"
          id="leader-email"
          autoComplete="email"
          {...register("email")}
        />
      </Field>

      {/* Where they live: we need someone local, who can also cover our
          other choirs. The first part of the postcode is enough to judge
          the distance without asking for a full address. */}
      <p className="mt-4 text-sm text-gray-300">
        Where do you live? Our leaders sometimes cover each other&apos;s choirs,
        so we&apos;re looking for someone who can easily travel around our
        Surrey venues.
      </p>
      <Field id="leader-town" label="Town *" error={errors.town?.message}>
        <input
          className={inputClass}
          type="text"
          id="leader-town"
          autoComplete="address-level2"
          {...register("town")}
        />
      </Field>
      <Field
        id="leader-postcode"
        label="Postcode area *"
        error={errors.postcode?.message}
      >
        <input
          className={`${inputClass} md:w-32`}
          type="text"
          id="leader-postcode"
          placeholder="e.g. KT12"
          {...register("postcode")}
        />
      </Field>

      <Field
        id="leader-experience"
        label="Experience *"
        error={errors.experience?.message}
      >
        <textarea
          className="h-48 w-full rounded pl-1 text-sm text-black"
          id="leader-experience"
          placeholder="Choirs or groups you've led, singing and musical theatre experience, teaching, qualifications..."
          {...register("experience")}
        />
      </Field>
      <p className="mb-3 mt-1 text-xs text-gray-300 md:ml-32">
        Please don&apos;t include links - we&apos;ll ask for a CV or videos if
        we&apos;d like to see more.
      </p>

      <LoadingButton
        disabled={false}
        text="Send application"
        loading={loading}
      />

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

export default LeaderApplicationForm;

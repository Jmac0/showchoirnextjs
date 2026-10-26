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
  MAX_ANSWER_LENGTH,
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
  canDrive: boolean;
  experience: string;
  motivation: string;
  questions: string | undefined;
  company: string | undefined;
};

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  town: "",
  postcode: "",
  canDrive: false,
  experience: "",
  motivation: "",
  questions: "",
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
    // ticked = yes, they drive and have a car (so can cover other choirs)
    canDrive: yup.boolean().required(),
    motivation: yup
      .string()
      .trim()
      .required("Please tell us what excites you about the role")
      .max(
        MAX_ANSWER_LENGTH,
        `Please keep this under ${MAX_ANSWER_LENGTH} characters`
      )
      .test("no-links", LINK_MESSAGE, noLinks),
    // optional
    questions: yup
      .string()
      .trim()
      .max(
        MAX_ANSWER_LENGTH,
        `Please keep this under ${MAX_ANSWER_LENGTH} characters`
      )
      .test("no-links", LINK_MESSAGE, noLinks),
    // honeypot field - real users never see or fill this in,
    // so any submission with it populated is almost certainly a bot
    company: yup.string(),
  })
  .required();

// One field: label on top, right above the input, then its error message
// underneath - the same for every field, so they all line up. From md up
// each field is a centred column 2/3 of the form wide (see column). The error
// line keeps its height when empty, so the form doesn't jump when one
// appears - that space is also the gap before the next field.
// Full width on phones; from md up 2/3 of the form, centred. Used by the
// fields, the car checkbox and the links note, so their left edges line up.
const column = "w-full md:w-2/3 md:self-center";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
};
function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className={`mt-2 flex flex-col ${column}`}>
      <label className="mb-1" htmlFor={id}>
        {label}
      </label>
      {children}
      <span className="h-4 md:h-5">
        {error && (
          <span role="alert" className="mt-0.5 flex text-xs text-red-400">
            {error}
          </span>
        )}
      </span>
    </div>
  );
}
Field.defaultProps = { error: undefined };

// every input and text box fills its field's column
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
      <p className={`mt-4 text-sm text-gray-300 ${column}`}>
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
          className={inputClass}
          type="text"
          id="leader-postcode"
          placeholder="e.g. KT12"
          {...register("postcode")}
        />
      </Field>
      {/* with the location questions: driving is how leaders get to the
          other choirs they cover */}
      <div className={`mt-2 flex items-center gap-2 ${column}`}>
        <input
          className="h-4 w-4 accent-lightGold"
          type="checkbox"
          id="leader-can-drive"
          {...register("canDrive")}
        />
        <label htmlFor="leader-can-drive">
          I drive and have access to a car
        </label>
      </div>

      <Field
        id="leader-experience"
        label="Experience *"
        error={errors.experience?.message}
      >
        <textarea
          className={`${inputClass} h-48`}
          id="leader-experience"
          placeholder="Choirs or groups you've led, singing and musical theatre experience, teaching, qualifications..."
          {...register("experience")}
        />
      </Field>
      <Field
        id="leader-motivation"
        label="What excites you most about becoming a Show Choir leader? *"
        error={errors.motivation?.message}
      >
        <textarea
          className={`${inputClass} h-28`}
          id="leader-motivation"
          {...register("motivation")}
        />
      </Field>
      <Field
        id="leader-questions"
        label="Any questions for us?"
        error={errors.questions?.message}
      >
        <textarea
          className={`${inputClass} h-20`}
          id="leader-questions"
          {...register("questions")}
        />
      </Field>
      <p className={`mb-3 mt-1 text-xs text-gray-300 ${column}`}>
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

import React, { useEffect, useState } from "react";

import { LoadingButton } from "@/src/components/LoadingButton";
import useHttp from "@/src/hooks/useHttp";

// import { LoadingBtn } from "../LoadingBtn/LoadingBtn";
// import { UserMessage } from "../UserMessage/UserMessage";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  option: string;
};

const initialFormState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  option: "",
};
const BookTasterFrom: React.FC = () => {
  // destructure values from useHttp
  const {
    loading,
    message,
    setLoading,
    sendRequest,
    showUserMessage,
    setShowUserMessage,
    isErrorMessage,
  } = useHttp({
    url: "/api/mailchimp/bookTasterSession",
    method: "POST",
    withCredentials: false,
  });

  // state to disable submit button
  const [disableBtn, setDisableBtn] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  // regex to check for .ru email addresses
  // Only reset form if no error
  useEffect(() => {
    if (!isErrorMessage) {
      setFormState(initialFormState);
    }
  }, [isErrorMessage]);
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setShowUserMessage(false);
    const { name, value } = event.target;
    setFormState({
      ...formState,
      [name]: value,
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    sendRequest(formState);
  };
  return (
    <form
      className="flex w-11/12 flex-col justify-evenly self-center rounded-md border-2 border-lightGold bg-lightBlack/75 p-2
	  pl-5 text-gray-50 md:w-2/3 lg:absolute lg:bottom-2 lg:right-10  lg:w-1/3 lg:bg-black/75 "
      onSubmit={handleSubmit}
    >
      <h1 className="pb-1 pt-1">Book Your Free Taster</h1>
      <div className="my-2 flex flex-row">
        <label className="w-32" htmlFor="first-name">
          First name:
        </label>
        <input
          className="w-6/12 rounded pl-1 text-sm text-black"
          type="text"
          id="first-name"
          name="firstName"
          value={formState.firstName}
          onChange={handleInputChange}
        />
      </div>

      <div className="my-2 flex flex-row">
        <label className="w-32" htmlFor="last_name">
          Last name:
        </label>
        <input
          className="w-6/12 rounded pl-1 text-sm text-black"
          type="text"
          id="last_name"
          name="lastName"
          value={formState.lastName}
          onChange={handleInputChange}
        />
      </div>

      <div className="my-2 flex flex-row">
        <label className="w-32" htmlFor="email">
          Email:
        </label>
        <input
          className="w-6/12 rounded pl-1 text-sm text-black"
          type="email"
          id="email"
          name="email"
          value={formState.email}
          onChange={handleInputChange}
        />
      </div>
      <div className="my-2 flex flex-row">
        <label className="w-32" htmlFor="option">
          Location:
        </label>
        <select
          className="w-6/12 text-black"
          id="option"
          name="option"
          value={formState.option}
          onChange={handleInputChange}
        >
          <option value="">Choose a choir</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
          <option value="option4">Option 4</option>
          <option value="option5">Option 5</option>
        </select>
      </div>
      <LoadingButton disabled={disableBtn} text="Book Now" loading={loading} />
      {/*
       Show message component if there is a message
       {showUserMessage && (
       <UserMessage
       message={message}
       isError={isErrorMessage}
       showMessage={showUserMessage}
       />
       )} */}
    </form>
  );
};

export default BookTasterFrom;

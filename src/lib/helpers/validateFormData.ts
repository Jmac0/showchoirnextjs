import { NextApiResponse } from "next";

const ValidLocations = [
  "Banstead",
  "Leatherhead",
  "Dorking",
  "Cobham",
  "West Byfleet",
];

type ValidateFormDataArgs = {
  method: string | undefined;
  firstName: string;
  lastName: string;
  email: string;
  // location is only relevant to forms that collect a choir location
  // (e.g. BookTasterForm) - omit it for forms that don't, like ContactForm
  location?: string;
  res: NextApiResponse;
};

// function to validate form submission against common spam emails
export function validateFormData({
  method,
  firstName,
  lastName,
  email,
  location,
  res,
}: ValidateFormDataArgs) {
  if (method !== "POST") {
    return res.status(401).json({ message: "Method is not supported" });
  }
  const regex = /.*.ru$/;
  // check first and last names are not the same as an anti-spam filter
  if (firstName === lastName) {
    return res
      .status(401)
      .json({ message: "First name must be different from last name" });
  }
  // check email does not end in .ru
  if (regex.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email" });
  }
  if (location !== undefined && !ValidLocations.includes(location)) {
    return res
      .status(401)
      .json({ message: "Please only use existing locations" });
  }

  return null;
}

import { enc } from "crypto-js";
import AES from "crypto-js/aes";

const key = process.env.EMAIL_SECRET as string;
// Function to hash email for use as url param, returns hashed email as string
const encryptEmail = (email: string): string => {
  const ciphertext = AES.encrypt(email, key);
  return encodeURIComponent(ciphertext.toString());
};

const decryptEmail = (encryptedEmail: string) => {
  const decodedStr = decodeURIComponent(encryptedEmail);
  const decryptedStr = AES.decrypt(decodedStr, key).toString(enc.Utf8);
  return decryptedStr || "";
};

export { decryptEmail, encryptEmail };

import QRCode from "react-qr-code";

type Props = {
  email: string;
  firstName?: string;
  lastName?: string;
  handlePrint: () => void;
};

// The QR code's contents - exactly the same as the app's membership card
// (showChoirExpoApp/src/app/(app)/index.tsx), so the GA's scanner reads both:
//   {"email":"...","first_name":"...","last_name":"..."}
// Keep the two in step if this ever changes.
export const membershipQrValue = (
  email: string,
  firstName = "",
  lastName = ""
) => JSON.stringify({ email, first_name: firstName, last_name: lastName });

export function MembershipCard({
  email,
  firstName,
  lastName,
  handlePrint,
}: Props) {
  return (
    <div className="flex flex-col items-center">
      <h1>Membership Card</h1>
      {email ? (
        <section
          id="code"
          className="mt-5 flex items-center justify-center bg-white p-10 md:p-10"
        >
          <QRCode
            data-testid="qr"
            size={250}
            value={membershipQrValue(email, firstName, lastName)}
            viewBox="0 0 256 256"
          />
        </section>
      ) : (
        <h1>Invalid Email Please Login again</h1>
      )}
      <section className="mt-5 w-9/12 rounded-md bg-slate-50 p-3 md:w-5/12">
        If you would like to print the QR code, use the button below and then
        use you printer popup to set the size that you would like
      </section>
      <button
        className={` mt-8 h-10 min-w-max rounded-md border-2 border-lightGold bg-transparent px-5 text-white shadow-md  hover:shadow-amber-300/70 
		enabled:transition-colors enabled:duration-300  enabled:hover:bg-lightGold enabled:hover:text-black disabled:opacity-75`}
        type="button"
        onClick={handlePrint}
      >
        Print Card
      </button>
    </div>
  );
}

MembershipCard.defaultProps = {
  firstName: "",
  lastName: "",
};

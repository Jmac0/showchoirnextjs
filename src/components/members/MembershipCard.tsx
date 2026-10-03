import Link from "next/link";
import QRCode from "react-qr-code";

type Props = {
  email: string;
  firstName?: string;
  lastName?: string;
  handlePrint: () => void;
  // False once a Direct Debit membership has ended (14 days after the
  // Direct Debit stopped) - the QR code is hidden and they're pointed to
  // setting up a new Direct Debit (isMembershipActive in lib/directDebit.ts)
  isActive?: boolean;
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
  isActive,
}: Props) {
  if (!isActive) {
    return (
      <div className="flex flex-col items-center">
        <h1>Membership Card</h1>
        <section className="mt-5 flex w-11/12 max-w-md flex-col items-center gap-4 rounded-xl border-2 border-amber-400 bg-lightBlack/90 p-6 text-center text-gray-200">
          <p>
            Your membership isn&apos;t active at the moment, so your membership
            card isn&apos;t available.
          </p>
          <p>Set up a new Direct Debit to get it back straight away.</p>
          <Link
            href="/members/dashboard?component=account"
            className="rounded-md bg-lightGold px-4 py-2 font-bold text-black hover:bg-white"
          >
            Go to my account
          </Link>
        </section>
      </div>
    );
  }

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
  isActive: true,
};

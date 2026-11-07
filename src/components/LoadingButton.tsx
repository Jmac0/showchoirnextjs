type Props = {
  text: string;
  disabled: boolean;
  loading: boolean;
  // extras drawn over the button, e.g. a SparkleBurst
  // eslint-disable-next-line react/require-default-props
  children?: React.ReactNode;
};
// Button that displays initial text passed in as a prop then text
// "Loading while an async action is performed"
export const LoadingButton = ({
  text,
  loading,
  disabled = false,
  children,
}: Props) => (
  <button
    disabled={loading || disabled}
    className={`relative mt-6 w-2/3 self-center rounded-full bg-lightGold px-8 py-3 font-bold uppercase tracking-wide text-black transition enabled:hover:scale-105 enabled:hover:bg-yellow-100 disabled:opacity-75 md:w-auto md:min-w-[11rem] ${
      loading && "animate-pulse"
    } `}
    type="submit"
  >
    {loading ? "Loading" : text}
    {children}
  </button>
);

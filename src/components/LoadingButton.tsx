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
    className={`relative mt-6 h-10 w-2/3 self-center rounded-md border-2 border-lightGold bg-transparent text-white  shadow-md  
		hover:shadow-amber-300/70 enabled:transition-colors  enabled:duration-300 enabled:hover:bg-lightGold enabled:hover:text-black disabled:opacity-75 md:w-36 ${
      loading && "animate-pulse"
    } `}
    type="submit"
  >
    {loading ? "Loading" : text}
    {children}
  </button>
);

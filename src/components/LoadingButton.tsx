type Props = {
  text: string;
  disabled: boolean;
  loading: boolean;
};
// Button that displays initial text passed in as a prop then text
// "Loading while an async action is performed"
export const LoadingButton = ({ text, loading, disabled = false }: Props) => (
  <button
    disabled={loading || disabled}
    className={` mt-2 h-10 min-w-max rounded-md border-2 border-lightGold bg-transparent px-5 shadow-md  hover:shadow-amber-300/70 
		enabled:transition-colors enabled:duration-300  enabled:hover:bg-lightGold enabled:hover:text-black disabled:opacity-75 ${
      loading && "animate-pulse"
    } `}
    type="submit"
  >
    {loading ? "Loading" : text}
  </button>
);

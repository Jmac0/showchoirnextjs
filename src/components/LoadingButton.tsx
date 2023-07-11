type Props = {
  text: string;
  disabled: boolean;
  loading: boolean;
};

export const LoadingButton = ({ text, loading, disabled = false }: Props) => (
  <button
    disabled={loading || disabled}
    className={` mt-2 h-10 min-w-max rounded-md border-2 border-lightGold bg-transparent px-5  enabled:transition-colors 
		enabled:duration-500 enabled:hover:bg-lightGold enabled:hover:text-black disabled:opacity-75 ${
      loading && "animate-pulse"
    } `}
    type="submit"
  >
    {loading ? "Loading" : text}
  </button>
);

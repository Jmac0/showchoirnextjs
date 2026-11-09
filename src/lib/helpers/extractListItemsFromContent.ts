type ContentWithListType = {
  type: string;
  props: { children: { type: string; props: { children: string } }[] };
}[];

// function to extract list items from Contentful
export function extractListItemsFromContentful(
  contentWithList: ContentWithListType | null | undefined
) {
  // Initialize empty array to hold strings from Contentful
  let listItems: string[] = [];

  // find the list object containing the text needed with type "ul"
  // nothing when the list is missing in Contentful
  const list = (contentWithList ?? []).find((obj) => obj.type === "ul");
  if (list) {
    const {
      props: { children },
    } = list;

    // extract the individual list items text into an array
    listItems = children.map((element: { props: { children: string } }) => {
      const {
        props: { children },
      } = element;
      return children;
    });
  }

  return listItems;
}

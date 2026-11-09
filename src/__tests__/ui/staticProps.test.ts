import { extractListItemsFromContentful } from "../../lib/helpers/extractListItemsFromContent";
import { withoutUndefined } from "../../lib/staticProps";

describe("withoutUndefined", () => {
  it("drops values Contentful left out, which Next can't send", () => {
    const props = withoutUndefined({
      venues: [{ location: "Show Choir Cobham", parking: undefined }],
      title: undefined,
    });
    expect(props).toEqual({ venues: [{ location: "Show Choir Cobham" }] });
  });
});

describe("extractListItemsFromContentful", () => {
  it("gives no items when the list is missing", () => {
    expect(extractListItemsFromContentful(undefined)).toEqual([]);
    expect(extractListItemsFromContentful(null)).toEqual([]);
  });
});

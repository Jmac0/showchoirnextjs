import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, Document } from "@contentful/rich-text-types";
import { render } from "@testing-library/react";

import {
  belowTitleFormatOptions,
  inlineFormatOptions,
} from "../../lib/contentfulFormatOptions";
import { extractListItemsFromContentful } from "../../lib/helpers/extractListItemsFromContent";
import { withoutUndefined } from "../../lib/staticProps";

const text = (value: string) => ({
  nodeType: "text",
  value,
  marks: [],
  data: {},
});
const block = (nodeType: string, ...content: object[]) => ({
  nodeType,
  data: {},
  content,
});
const doc = (...content: object[]) =>
  block(BLOCKS.DOCUMENT, ...content) as unknown as Document;

describe("withoutUndefined", () => {
  it("drops values Contentful left out, which Next can't send", () => {
    const props = withoutUndefined({
      venues: [{ location: "Show Choir Cobham", parking: undefined }],
      title: undefined,
    });
    expect(props).toEqual({ venues: [{ location: "Show Choir Cobham" }] });
    expect(JSON.stringify(props)).not.toContain("undefined");
  });
});

describe("extractListItemsFromContentful", () => {
  it("gives no items when the list is missing", () => {
    expect(extractListItemsFromContentful(undefined)).toEqual([]);
    expect(extractListItemsFromContentful(null)).toEqual([]);
  });
});

describe("inlineFormatOptions (Contentful text inside a heading)", () => {
  it("never puts a heading, list or paragraph inside the heading", () => {
    const { container } = render(
      <h2>
        {documentToReactComponents(
          doc(
            block(BLOCKS.PARAGRAPH, text("Come and sing")),
            block(BLOCKS.HEADING_3, text("A heading")),
            block(
              BLOCKS.UL_LIST,
              block(
                BLOCKS.LIST_ITEM,
                block(BLOCKS.PARAGRAPH, text("A list item"))
              )
            )
          ),
          inlineFormatOptions
        )}
      </h2>
    );
    const heading = container.querySelector("h2");
    expect(heading?.querySelectorAll("p, h1, h3, ul, li")).toHaveLength(0);
    expect(heading?.textContent).toContain("A list item");
  });
});

describe("belowTitleFormatOptions (text under a page's own h1)", () => {
  it("turns a Contentful Heading 1 into an h2", () => {
    const { container } = render(
      <div>
        {documentToReactComponents(
          doc(block(BLOCKS.HEADING_1, text("Who are we?"))),
          belowTitleFormatOptions
        )}
      </div>
    );
    expect(container.querySelector("h1")).toBeNull();
    expect(container.querySelector("h2")?.textContent).toBe("Who are we?");
  });
});

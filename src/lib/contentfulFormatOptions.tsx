/* eslint-disable @typescript-eslint/no-explicit-any */
import { BLOCKS } from "@contentful/rich-text-types";
// styles the ul from contentful
export const formatOptions: any = {
  renderNode: {
    [BLOCKS.UL_LIST]: (node: never, children: never[]) => (
      <ul>
        {/* eslint-disable-next-line react/destructuring-assignment */}
        {children.map((item: any) => (
          <li key={item.key}>{item.props.children[0].props.children[0]}</li>
        ))}
      </ul>
    ),
  },
};

// For Contentful text on a page that already has its own h1 (e.g. the About
// page's title): a Heading 1 typed in Contentful comes out as an h2, styled
// like the site's h1 (global.css), so the page keeps a single main heading
export const belowTitleFormatOptions: any = {
  renderNode: {
    ...formatOptions.renderNode,
    [BLOCKS.HEADING_1]: (node: never, children: React.ReactNode) => (
      <h2 className="pb-0 text-4xl text-lightGold">{children}</h2>
    ),
  },
};

// For Contentful text shown inside a heading: a heading can't hold
// paragraphs, other headings, lists or quotes (browsers move them out, and
// the page then doesn't match what React built), so every block - whatever
// an editor types - becomes a line of its own instead
const asLine = (node: never, children: React.ReactNode) => (
  <span className="block">{children}</span>
);
export const inlineFormatOptions: any = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: asLine,
    [BLOCKS.HEADING_1]: asLine,
    [BLOCKS.HEADING_2]: asLine,
    [BLOCKS.HEADING_3]: asLine,
    [BLOCKS.HEADING_4]: asLine,
    [BLOCKS.HEADING_5]: asLine,
    [BLOCKS.HEADING_6]: asLine,
    [BLOCKS.UL_LIST]: asLine,
    [BLOCKS.OL_LIST]: asLine,
    [BLOCKS.LIST_ITEM]: asLine,
    [BLOCKS.QUOTE]: asLine,
    [BLOCKS.TABLE]: asLine,
    [BLOCKS.TABLE_ROW]: asLine,
    [BLOCKS.TABLE_CELL]: asLine,
    [BLOCKS.TABLE_HEADER_CELL]: asLine,
    // a dividing line or embedded item has no place in a heading
    [BLOCKS.HR]: () => null,
    [BLOCKS.EMBEDDED_ENTRY]: () => null,
    [BLOCKS.EMBEDDED_ASSET]: () => null,
  },
};

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

// For Contentful text shown inside a heading: a heading can't hold
// paragraphs (browsers move them out, and the page then doesn't match what
// React built), so each paragraph becomes a line of its own instead
export const inlineFormatOptions: any = {
  renderNode: {
    ...formatOptions.renderNode,
    [BLOCKS.PARAGRAPH]: (node: never, children: React.ReactNode) => (
      <span className="block">{children}</span>
    ),
  },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import { BLOCKS } from "@contentful/rich-text-types";
// TODO fix types for this
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

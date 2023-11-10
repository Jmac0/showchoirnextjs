import { BLOCKS } from "@contentful/rich-text-types";

export type PageItemType = {
  email?: string;
  pathData: {
    slug: string;
    displayText: string;
    order: number;
  }[];
};
export type userDataType = {
  email: string;
  flexi_sessions: number;
  active_member: boolean;
  active_mandate: boolean;
  flexi_type: string;
  membership_type: string;
  first_name: string;
};

export type ContentBlocksType = {
  data: object;
  content: [];
  nodeType: BLOCKS.DOCUMENT;
};

export type VenueType = {
  location: string;
  address: ContentBlocksType;
  order: number;
  mapid: string;
};

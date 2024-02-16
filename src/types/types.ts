import { BLOCKS } from "@contentful/rich-text-types";

export type PageItemType = {
  email?: string;
  user?: UserDataType;
  pathData: {
    slug: string;
    displayText: string;
    order: number;
  }[];
};

export type UserDataType = {
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
export type NotificationType = {
  title: string;
  date: string;
  pinned: boolean;
  details: string;
};

export type VenueType = {
  location: string;
  data?: object;
  photo: { fields: { title: string; file: { url: string } } };
  choirDayOfWeek: string;
  address: ContentBlocksType;
  order: number;
  mapid: string;
  time: string;
  parking?: string;
  googleMap?: string;
  slug: string;
};

export type PathDataType = {
  fields: { slug: string; displayText: string; order: number };
};

export type DashboardPropsType = {
  user: UserDataType;
  notifications: {
    items: {
      fields: NotificationType;
    }[];
  };
};

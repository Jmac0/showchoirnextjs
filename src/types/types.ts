import { BLOCKS } from "@contentful/rich-text-types";

import type { DirectDebitNotice } from "@/src/lib/directDebit";
import type { FlexiExpiryNotice } from "@/src/lib/flexiExpiry";

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
  // Direct Debit membership active (including the grace period after it stops)
  active_mandate: boolean;
  // Set if their Direct Debit has stopped - shown as a notice
  direct_debit?: DirectDebitNotice | null;
  // Whether their membership card (QR code) is shown - see
  // isMembershipActive in lib/directDebit.ts
  card_active?: boolean;
  // Flexi members: when their sessions expire, if within a month (warning)
  flexi_expiry?: FlexiExpiryNotice | null;
  // When their Flexi sessions expired (membership_type "flexi_expired")
  flexi_expired_at?: string | null;
  flexi_type: string;
  membership_type: string;
  first_name: string;
  last_name: string;
  // "ga" (glamorous assistant) unlocks the member-scanning tab in the app
  role?: string;
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
export type FeatureDataType = {
  text: string;
  image: string;
  imageDescription: string;
}[];

export type ContentfulImageType = {
  fields: { file: { url: string }; title: string };
};

export type HeadersType = {
  headers: {
    authorization: string;
  };
};

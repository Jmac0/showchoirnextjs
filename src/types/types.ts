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

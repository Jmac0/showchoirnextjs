// Type for Gocardless mandate
export type MandateType = {
  id: string;
  created_at: string;
  resource_type: string;
  action: string;
  links: {
    customer?: string;
    mandate?: string;
    mandate_request_mandate?: string;
  };
  details: {
    origin: string;
    cause: string;
    description: string;
  };
};
// Type for new customer database entry
export type MemberType = {
  direct_debit_started?: string;
  direct_debit_cancelled?: string;
  active_mandate: boolean;
  mandate?: string;
  membership_type?: string | null;
  go_cardless_id: string;
  first_name: string;
  last_name: string;
  phone_number: number;
  post_code: string;
  street_address: string;
  town_city: string;
  county: string;
  email: string;
  age_confirm: boolean;
  home_choir: string;
  consent: boolean;
};

export type GocardlessWebhookEvent = {
  action: string;
  links: {
    customer: string;
    mandate_request_mandate: string;
    mandate: string;
  };
};

// Type for Contenful page, used in Nav
/*
 export type PageItem = {
 slug: string;
 displayText: string;
 order: number;
 };
 */
// Typer for reqestConfig object used in useHttp
/*
 export type RequestConfig = {
 url: string;
 method: string;
 withCredentials: boolean;
 token?: string;
 };
 export type MockResponseType = {
 message?: string;
 status?: number;
 authorisation_url?: string;
 };
 */

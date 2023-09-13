declare module "*module.css" {
  const styles: {
    [className: string]: string;
  };
  export default styles;
}
// extend stripe webhook event to include metadata
declare module "stripe" {
  namespace Stripe {
    interface Event {
      data: {
        object: {
          metadata: {
            // Custom metadata properties here
            user: string;
            orderItems: string;
          };
        };
      };
    }
  }
}

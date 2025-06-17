export const ERROR = {
    FAILED_UPDATE:'Failed to update webhook event',
    SAVE_FAILED:'Erro saving the webhook event',
    HANDLE_FAILED:'Error handling the Webhook event',
    HANDLE_FAILED_PAYMENTINTENT:'Error handling payment intent created:',
    NOT_EXIST_PAYMENTINTENT:'No OrderID in the payment intent metadata',
    NO_SESSION_PAYMENTINTENT:'No session found for payment intent',
    NO_INTENT:'No payment intent found in charge',
    NO_ORDERID:'No orderId found in payment intent metadata',
    NO_RAW_BODY:'No raw body found.',
    NO_SIG:'No stripe-signature header found'
  };
  
  export const SUCCESS = {
    PAYMENTINTENT_SUCCEEDED:'Payment intent succeeded for order:',
    WEBHOOOK_SUCCES:'Webhook event received successfully'
  };
export const ERROR = {
  NOT_EXIST: 'Order does not exist',
  FAILED_CHECKOUT_SESSION: 'failed to create checkout session',
  NOT_FOUND: 'Payment Not Found',
  INVALID: 'OrderId provided is invalid',
  NOT_PROVIDED: 'OrderId is not provided',
  AMOUNT_INVALID: 'Order Amount is invalid',
  TAMPERED_AMOUNT:'Amount is tampered',
  PAYMENT_ALREADY_DONE: 'Can not Proceed,Payment already done for this OrderId',
  PAYMENT_REQUIRED:'Incomplete payment already for this Order ID',
  
};

export const SUCCESS = {
  SUCCESS: 'Payment done succesfully',
};

export const ROUTE = {
  CHECKOUT: 'checkout',
  PAYMENT: 'payment',
  RETRY: 'retry',
  REQUEST: 'request',
};

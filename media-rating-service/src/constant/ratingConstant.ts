export const CONSTANTS = {
  ERROR: 500,
  SUCCESS: 200,
  ERROR_S: "error",
  SUCCESS_S: "success",
  MESSAGE: {
    ERROR: "An error occurred while processing your request.",
    SUCCESS: "Request processed successfully.",
    RATING_ADDED: "Rating added successfully.",
    RATING_UPDATED: "Rating updated successfully.",
    RATING_DELETED: "Rating deleted successfully.",
    RATING_NOT_FOUND: "Rating not found.",
    REVIEWS_FETCHED: "Reviews fetched successfully.",
    AVERAGE_RATING_FETCHED: "Average rating fetched successfully.",
    INVALID_RATING: "Invalid rating value. Rating must be between 1 and 5.",
  },
};

export const RATING_CONSTANTS = {
  RATING_MIN: 1,
  RATING_MAX: 5,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

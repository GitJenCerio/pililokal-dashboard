// String literals for DB fields (SQLite doesn't support Prisma enums)
export type SubmissionType =
  | "WEBSITE_EXTRACTION"
  | "FB_IG_EXTRACTION"
  | "MERCHANT_SELECTED";

export type SelectionMode = "ALL_PRODUCTS" | "SELECTED_ONLY";

export type ShopifyStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "UPLOADED"
  | "LIVE";

export type ActivityType = "NOTE" | "STATUS_CHANGE" | "DATA_UPDATE";

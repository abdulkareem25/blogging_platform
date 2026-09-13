import Joi from "joi";
import { PAGINATION, SORT_OPTIONS } from "../constants/index.js";

export const paginatedQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

export const postQuerySchema = paginatedQuerySchema.keys({
  search: Joi.string().trim().max(200).allow(""),
  tag: Joi.string().trim().max(30).allow(""),
  sort: Joi.string().valid(SORT_OPTIONS.NEWEST, SORT_OPTIONS.OLDEST).default(SORT_OPTIONS.NEWEST),
});

export default paginatedQuerySchema;

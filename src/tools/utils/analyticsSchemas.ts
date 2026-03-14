import { z } from "zod";

export const isoIntervalSchema = z
  .string()
  .min(1)
  .describe(
    "ISO-8601 interval in the form start/end (for example: '2024-01-01T00:00:00Z/2024-01-02T00:00:00Z')",
  );

export const numericRangeSchema = z
  .object({
    gt: z.number().optional(),
    gte: z.number().optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
  })
  .passthrough();

export const analyticsPredicateSchema = z
  .object({
    type: z.string().optional(),
    dimension: z.string().optional(),
    operator: z.string().optional(),
    value: z.string().optional(),
    range: numericRangeSchema.optional(),
  })
  .passthrough();

export const analyticsClauseSchema = z
  .object({
    type: z.string(),
    predicates: z.array(analyticsPredicateSchema).min(1),
  })
  .passthrough();

export const analyticsFilterSchema = z
  .object({
    type: z.string(),
    clauses: z.array(analyticsClauseSchema).optional(),
    predicates: z.array(analyticsPredicateSchema).optional(),
  })
  .passthrough();

export const pagingSpecSchema = z
  .object({
    pageSize: z.number().int().positive().optional(),
    pageNumber: z.number().int().positive().optional(),
  })
  .passthrough();

export const analyticsQueryAggregationSchema = z
  .object({
    type: z.string(),
    field: z.string().optional(),
    metric: z.string().optional(),
  })
  .passthrough();

export const aggregationViewSchema = z
  .object({
    target: z.string(),
    name: z.string(),
    function: z.string(),
    range: numericRangeSchema.optional(),
  })
  .passthrough();

const baseAggregatesQuerySchema = z
  .object({
    interval: isoIntervalSchema,
    granularity: z.string().optional(),
    timeZone: z.string().optional(),
    groupBy: z.array(z.string()).optional(),
    filter: analyticsFilterSchema.optional(),
    metrics: z.array(z.string()).min(1),
    flattenMultivaluedDimensions: z.boolean().optional(),
    views: z.array(aggregationViewSchema).optional(),
    alternateTimeDimension: z.string().optional(),
  })
  .passthrough();

export const conversationAggregationQuerySchema = baseAggregatesQuerySchema;
export const userAggregationQuerySchema = baseAggregatesQuerySchema;
export const transcriptAggregationQuerySchema = baseAggregatesQuerySchema;

export const conversationAsyncAggregationQuerySchema = baseAggregatesQuerySchema
  .extend({
    pageSize: z.number().int().positive().optional(),
  })
  .passthrough();

export const userAsyncAggregationQuerySchema = baseAggregatesQuerySchema
  .extend({
    pageSize: z.number().int().positive().optional(),
  })
  .passthrough();

export const transcriptAsyncAggregationQuerySchema = baseAggregatesQuerySchema
  .extend({
    pageSize: z.number().int().positive().optional(),
  })
  .passthrough();

export const observationQuerySchema = z
  .object({
    filter: analyticsFilterSchema,
    metrics: z.array(z.string()).min(1),
    detailMetrics: z.array(z.string()).optional(),
  })
  .passthrough();

export const conversationDetailsQuerySchema = z
  .object({
    interval: isoIntervalSchema,
    conversationFilters: z.array(analyticsFilterSchema).optional(),
    segmentFilters: z.array(analyticsFilterSchema).optional(),
    evaluationFilters: z.array(analyticsFilterSchema).optional(),
    surveyFilters: z.array(analyticsFilterSchema).optional(),
    resolutionFilters: z.array(analyticsFilterSchema).optional(),
    order: z.string().optional(),
    orderBy: z.string().optional(),
    aggregations: z.array(analyticsQueryAggregationSchema).optional(),
    paging: pagingSpecSchema.optional(),
  })
  .passthrough();

export const asyncConversationDetailsQuerySchema = z
  .object({
    interval: isoIntervalSchema,
    conversationFilters: z.array(analyticsFilterSchema).optional(),
    segmentFilters: z.array(analyticsFilterSchema).optional(),
    evaluationFilters: z.array(analyticsFilterSchema).optional(),
    surveyFilters: z.array(analyticsFilterSchema).optional(),
    resolutionFilters: z.array(analyticsFilterSchema).optional(),
    order: z.string().optional(),
    orderBy: z.string().optional(),
    limit: z.number().int().positive().optional(),
    startOfDayIntervalMatching: z.boolean().optional(),
  })
  .passthrough();

export const usersDetailsQuerySchema = z
  .object({
    interval: isoIntervalSchema,
    userFilters: z.array(analyticsFilterSchema).optional(),
    presenceFilters: z.array(analyticsFilterSchema).optional(),
    routingStatusFilters: z.array(analyticsFilterSchema).optional(),
    order: z.string().optional(),
    presenceAggregations: z.array(analyticsQueryAggregationSchema).optional(),
    routingStatusAggregations: z
      .array(analyticsQueryAggregationSchema)
      .optional(),
    paging: pagingSpecSchema.optional(),
  })
  .passthrough();

export const asyncUsersDetailsQuerySchema = z
  .object({
    interval: isoIntervalSchema,
    userFilters: z.array(analyticsFilterSchema).optional(),
    presenceFilters: z.array(analyticsFilterSchema).optional(),
    routingStatusFilters: z.array(analyticsFilterSchema).optional(),
    order: z.string().optional(),
    limit: z.number().int().positive().optional(),
  })
  .passthrough();

export const activityQueryMetricSchema = z
  .object({
    metric: z.string(),
    details: z.boolean().optional(),
  })
  .passthrough();

export const activityQuerySchema = z
  .object({
    metrics: z.array(activityQueryMetricSchema).min(1),
    groupBy: z.array(z.string()).min(1),
    filter: analyticsFilterSchema.optional(),
    order: z.string().optional(),
  })
  .passthrough();

-- Harbor theme: calmer default lead status colours that sit with the navy / beige palette.
-- Only statuses still on the previous default colour change; colours an organization chose stay as they are.
UPDATE "lead_statuses" SET "color" = '#4a86c8', "updated_at" = now() WHERE "key" = 'NEW' AND lower("color") = '#3b82f6';
UPDATE "lead_statuses" SET "color" = '#6f7bd0', "updated_at" = now() WHERE "key" = 'ASSIGNED' AND lower("color") = '#6366f1';
UPDATE "lead_statuses" SET "color" = '#3598b8', "updated_at" = now() WHERE "key" = 'CONTACTED' AND lower("color") = '#0ea5e9';
UPDATE "lead_statuses" SET "color" = '#3f9f69', "updated_at" = now() WHERE "key" = 'POSITIVE' AND lower("color") = '#22c55e';
UPDATE "lead_statuses" SET "color" = '#d6793a', "updated_at" = now() WHERE "key" = 'NEGATIVE' AND lower("color") = '#f97316';
UPDATE "lead_statuses" SET "color" = '#9884c2', "updated_at" = now() WHERE "key" = 'UNRESPONSIVE' AND lower("color") = '#a855f7';
UPDATE "lead_statuses" SET "color" = '#cf9f2b', "updated_at" = now() WHERE "key" = 'FOLLOW_UP' AND lower("color") = '#eab308';
UPDATE "lead_statuses" SET "color" = '#e0913f', "updated_at" = now() WHERE "key" = 'CALLBACK' AND lower("color") = '#f59e0b';
UPDATE "lead_statuses" SET "color" = '#2c9c8e', "updated_at" = now() WHERE "key" = 'VISIT' AND lower("color") = '#14b8a6';
UPDATE "lead_statuses" SET "color" = '#237f74', "updated_at" = now() WHERE "key" = 'REVISIT' AND lower("color") = '#0d9488';
UPDATE "lead_statuses" SET "color" = '#7a62c4', "updated_at" = now() WHERE "key" = 'BOOKING' AND lower("color") = '#8b5cf6';
UPDATE "lead_statuses" SET "color" = '#2d8a55', "updated_at" = now() WHERE "key" = 'CLOSED_WON' AND lower("color") = '#16a34a';
UPDATE "lead_statuses" SET "color" = '#909aa6', "updated_at" = now() WHERE "key" = 'NOT_INTERESTED' AND lower("color") = '#94a3b8';
UPDATE "lead_statuses" SET "color" = '#cc5448', "updated_at" = now() WHERE "key" = 'LOST' AND lower("color") = '#ef4444';
UPDATE "lead_statuses" SET "color" = '#6f7885', "updated_at" = now() WHERE "key" = 'INVALID' AND lower("color") = '#64748b';

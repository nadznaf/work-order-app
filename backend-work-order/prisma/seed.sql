-- Clean up existing data
TRUNCATE TABLE "users" CASCADE;
TRUNCATE TABLE "work_orders" CASCADE;
TRUNCATE TABLE "sparepart_requests" CASCADE;
TRUNCATE TABLE "sparepart_items" CASCADE;

-- Insert Users
INSERT INTO "users" ("id", "name", "role", "created_at", "updated_at") VALUES
('uuid-1', 'Super Admin', 'ADMIN', NOW(), NOW()),
('uuid-2', 'Supervisor John', 'SPV', NOW(), NOW()),
('uuid-3', 'Mechanic Mike', 'MECHANIC', NOW(), NOW());

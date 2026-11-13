-- Hides the 37 old entries silver-pendant-set-no-43 to -79 that duplicated the necklaces.
-- These are replaced by silver-necklace-no-43 to -79 (photos-2026-11-13-necklace-earring.sql).
-- Soft delete (deleted_at) keeps order history. Pendant sets 1-42 are not touched.
UPDATE products
SET is_visible = 0, deleted_at = NOW(), updated_at = NOW()
WHERE slug IN (
    'silver-pendant-set-no-43','silver-pendant-set-no-44','silver-pendant-set-no-45','silver-pendant-set-no-46','silver-pendant-set-no-47',
    'silver-pendant-set-no-48','silver-pendant-set-no-49','silver-pendant-set-no-50','silver-pendant-set-no-51','silver-pendant-set-no-52',
    'silver-pendant-set-no-53','silver-pendant-set-no-54','silver-pendant-set-no-55','silver-pendant-set-no-56','silver-pendant-set-no-57',
    'silver-pendant-set-no-58','silver-pendant-set-no-59','silver-pendant-set-no-60','silver-pendant-set-no-61','silver-pendant-set-no-62',
    'silver-pendant-set-no-63','silver-pendant-set-no-64','silver-pendant-set-no-65','silver-pendant-set-no-66','silver-pendant-set-no-67',
    'silver-pendant-set-no-68','silver-pendant-set-no-69','silver-pendant-set-no-70','silver-pendant-set-no-71','silver-pendant-set-no-72',
    'silver-pendant-set-no-73','silver-pendant-set-no-74','silver-pendant-set-no-75','silver-pendant-set-no-76','silver-pendant-set-no-77',
    'silver-pendant-set-no-78','silver-pendant-set-no-79');

-- Removes the 37 necklaces (silver-earring-no-43 to -79) that were wrongly filed under Woman Earrings.
-- Soft delete (deleted_at) keeps any past order history, as the admin does. Only earring-category rows are touched.
-- The real necklaces are created by photos-2026-11-13-necklace-earring.sql under silver-pendant-set-no-43 to -79.
UPDATE products
SET is_visible = 0, deleted_at = NOW(), updated_at = NOW()
WHERE category_id = (SELECT id FROM categories WHERE slug = 'silver-earrings')
  AND slug IN (
    'silver-earring-no-43','silver-earring-no-44','silver-earring-no-45','silver-earring-no-46','silver-earring-no-47',
    'silver-earring-no-48','silver-earring-no-49','silver-earring-no-50','silver-earring-no-51','silver-earring-no-52',
    'silver-earring-no-53','silver-earring-no-54','silver-earring-no-55','silver-earring-no-56','silver-earring-no-57',
    'silver-earring-no-58','silver-earring-no-59','silver-earring-no-60','silver-earring-no-61','silver-earring-no-62',
    'silver-earring-no-63','silver-earring-no-64','silver-earring-no-65','silver-earring-no-66','silver-earring-no-67',
    'silver-earring-no-68','silver-earring-no-69','silver-earring-no-70','silver-earring-no-71','silver-earring-no-72',
    'silver-earring-no-73','silver-earring-no-74','silver-earring-no-75','silver-earring-no-76','silver-earring-no-77',
    'silver-earring-no-78','silver-earring-no-79');

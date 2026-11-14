-- Bowls and spoons: change purity from 925 sterling silver to 999 fine silver.
-- Only the 24 bowl and spoon products are touched. Run once in phpMyAdmin.

UPDATE products
SET purity = '999',
    material = '999 fine silver',
    description = REPLACE(description, '925 sterling silver', '999 fine silver'),
    updated_at = NOW()
WHERE slug IN (
  'silver-bowl-no-1','silver-bowl-no-2','silver-bowl-no-3','silver-bowl-no-4',
  'silver-bowl-no-5','silver-bowl-no-6','silver-bowl-no-7','silver-bowl-no-8',
  'silver-bowl-no-9','silver-bowl-no-10','silver-bowl-no-11','silver-bowl-no-12',
  'silver-spoon-no-1','silver-spoon-no-2','silver-spoon-no-3','silver-spoon-no-4',
  'silver-spoon-no-5','silver-spoon-no-6','silver-spoon-no-7','silver-spoon-no-8',
  'silver-spoon-no-9','silver-spoon-no-10','silver-spoon-no-11','silver-spoon-no-12'
);

DELETE FROM finish_product
WHERE product_id IN (
  SELECT id FROM (SELECT id FROM products WHERE slug IN (
  'silver-bowl-no-1','silver-bowl-no-2','silver-bowl-no-3','silver-bowl-no-4',
  'silver-bowl-no-5','silver-bowl-no-6','silver-bowl-no-7','silver-bowl-no-8',
  'silver-bowl-no-9','silver-bowl-no-10','silver-bowl-no-11','silver-bowl-no-12',
  'silver-spoon-no-1','silver-spoon-no-2','silver-spoon-no-3','silver-spoon-no-4',
  'silver-spoon-no-5','silver-spoon-no-6','silver-spoon-no-7','silver-spoon-no-8',
  'silver-spoon-no-9','silver-spoon-no-10','silver-spoon-no-11','silver-spoon-no-12'
  )) AS b
);

INSERT INTO finish_product (product_id, finish_id, price_adjustment, in_stock)
SELECT p.id, f.id, 0.00, 1
FROM products p, finishes f
WHERE p.slug IN (
  'silver-bowl-no-1','silver-bowl-no-2','silver-bowl-no-3','silver-bowl-no-4',
  'silver-bowl-no-5','silver-bowl-no-6','silver-bowl-no-7','silver-bowl-no-8',
  'silver-bowl-no-9','silver-bowl-no-10','silver-bowl-no-11','silver-bowl-no-12',
  'silver-spoon-no-1','silver-spoon-no-2','silver-spoon-no-3','silver-spoon-no-4',
  'silver-spoon-no-5','silver-spoon-no-6','silver-spoon-no-7','silver-spoon-no-8',
  'silver-spoon-no-9','silver-spoon-no-10','silver-spoon-no-11','silver-spoon-no-12'
)
AND f.slug = '9999-fine-silver';

-- Check: should return 24 rows, all with purity 999.
SELECT slug, purity, material FROM products
WHERE slug LIKE 'silver-bowl-no-%' OR slug LIKE 'silver-spoon-no-%'
ORDER BY slug;

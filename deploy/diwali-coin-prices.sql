-- Diwali coins only: fixed prices, straightened photos (photos are already in backend/public/uploads/products/shared/),
-- no material or care, shown on the site with a fixed price. Run once. The show_fixed_price column must already exist (it does if the earlier import ran).

-- 5 Gram Lakshmi Saraswati Ganesh Coin (AVY-SC-007)
UPDATE products SET name='5 Gram Lakshmi Saraswati Ganesh Coin', description='5 Gram 999 Fine Silver Lakshmi Saraswati Ganesh Coin. 999 fine silver (99.9% purity) with Maa Lakshmi seated on a lotus, Maa Saraswati for knowledge and wisdom, Lord Ganesha for success and auspicious beginnings, and traditional motifs of devotion and good fortune. A small coin with meaningful tradition, for Diwali, festive celebrations, weddings, housewarmings and gifting.', material=NULL, care=NULL, price=35.00, show_fixed_price=1, tax_exempt=0, tag=NULL, kind='bullion', in_stock=1, stock_qty=NULL, is_visible=1, deleted_at=NULL, weight_grams=5, updated_at=NOW() WHERE sku='AVY-SC-007';

-- 10 Gram Lakshmi Saraswati Ganesh Coin (AVY-SC-008)
UPDATE products SET name='10 Gram Lakshmi Saraswati Ganesh Coin', description='10 Gram 999 Fine Silver Lakshmi Saraswati Ganesh Coin. 999 fine silver (99.9% purity) featuring Maa Lakshmi for wealth and prosperity, Maa Saraswati for knowledge and creativity, Lord Ganesha for success, a sacred kalash for purity and divine blessings, and Shree, Shubh and Labh for prosperity, good fortune and growth. Perfect for Diwali, Dhanteras, weddings, housewarmings and gifting.', material=NULL, care=NULL, price=65.00, show_fixed_price=1, tax_exempt=0, tag=NULL, kind='bullion', in_stock=1, stock_qty=NULL, is_visible=1, deleted_at=NULL, weight_grams=10, updated_at=NOW() WHERE sku='AVY-SC-008';

-- Check: should return 2 rows with price 35.00 and 65.00 and show_fixed_price 1.
SELECT sku, name, price, show_fixed_price, tax_exempt, in_stock FROM products WHERE sku IN ('AVY-SC-007','AVY-SC-008');

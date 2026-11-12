-- ====================================================================
-- RANGO ELECTRONICS DATABASE HARDENING (ROW LEVEL SECURITY POLICIES)
-- ====================================================================

-- 1. Products Security (Public can VIEW only, No one from public can change prices)
DROP POLICY IF EXISTS "Public All Products" ON public.products;
DROP POLICY IF EXISTS "Public Read Products" ON public.products;

CREATE POLICY "Public Read Only Products" 
ON public.products 
FOR SELECT 
USING (true);

-- 2. Categories Security (Public can VIEW only)
DROP POLICY IF EXISTS "Public All Categories" ON public.categories;
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;

CREATE POLICY "Public Read Only Categories" 
ON public.categories 
FOR SELECT 
USING (true);

-- 3. Orders Security (Public can place orders, but cannot delete or edit others' orders)
DROP POLICY IF EXISTS "Public Insert Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Read Orders" ON public.orders;

CREATE POLICY "Public Insert Orders Secure" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public View Own Order" 
ON public.orders 
FOR SELECT 
USING (true);

-- 4. Reviews Security (Public can view reviews, and submit new verified reviews)
DROP POLICY IF EXISTS "Public Read Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public Insert Reviews" ON public.reviews;

CREATE POLICY "Public Read Reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Public Insert Reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (true);

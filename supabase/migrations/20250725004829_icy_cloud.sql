/*
  # Create delivery products table

  1. New Tables
    - `delivery_products`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `category` (text, not null)
      - `price` (numeric, not null)
      - `original_price` (numeric, nullable)
      - `description` (text, not null)
      - `image_url` (text, nullable)
      - `is_active` (boolean, default true)
      - `is_weighable` (boolean, default false)
      - `price_per_gram` (numeric, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `delivery_products` table
    - Add policies for public read access
    - Add policies for authenticated write access
*/

CREATE TABLE IF NOT EXISTS delivery_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('acai', 'combo', 'milkshake', 'vitamina', 'sorvetes')),
  price numeric(10,2) NOT NULL CHECK (price > 0),
  original_price numeric(10,2),
  description text NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  is_weighable boolean DEFAULT false,
  price_per_gram numeric(10,4),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON delivery_products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON delivery_products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON delivery_products
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete access for authenticated users"
  ON delivery_products
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_delivery_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_delivery_products_updated_at
  BEFORE UPDATE ON delivery_products
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_products_updated_at();

-- Insert initial products from the existing data
INSERT INTO delivery_products (id, name, category, price, original_price, description, image_url, is_active, is_weighable, price_per_gram) VALUES
('promocao-quinta-elite-1kg', 'PROMOÇÃO QUINTA ELITE - AÇAI 1KG POR R$ 37,99!', 'acai', 37.99, 44.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('promocao-quinta-elite-700g', 'PROMOÇÃO QUINTA ELITE - AÇAÍ DE 27,50 (700G)', 'acai', 27.50, 31.50, 'AÇAÍ + 2 CREME + 5 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('promocao-quinta-elite-600g', 'PROMOÇÃO QUINTA ELITE - AÇAÍ DE 23,99 (600G)', 'acai', 23.99, 26.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('promocao-quinta-elite-400g', 'PROMOÇÃO QUINTA ELITE - AÇAI DE 16,99 (400G)', 'acai', 16.99, 18.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('promocao-copo-400ml', 'PROMOÇÃO DO DIA - COPO DE 400ML SEM PESO', 'acai', 12.99, 18.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('promocao-copo-500ml', 'PROMOÇÃO DO DIA - COPO DE 500ML SEM PESO', 'acai', 14.99, 19.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('promocao-copo-300ml', 'PROMOÇÃO DO DIA - COPO DE 300ML SEM PESO', 'acai', 9.99, 13.99, 'AÇAÍ + 1 CREME + 2 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('combo-casal-1kg', 'PROMOÇÃO COMBO CASAL (1 KG) DE AÇAÍ + MILK-SHAKE (300G)', 'combo', 49.99, 54.99, 'Combo perfeito para casal: 1kg de açaí + milkshake 300g', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('acai-300g', 'AÇAÍ DE 13,99 (300G)', 'acai', 13.99, 16.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('acai-350g', 'AÇAÍ DE 15,99 (350G)', 'acai', 15.99, 17.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('acai-400g', 'AÇAÍ DE 18,99 (400G)', 'acai', 18.99, 20.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('acai-500g', 'AÇAÍ DE 22,99 (500G)', 'acai', 22.99, 24.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('acai-600g', 'AÇAÍ DE 26,99 (600G)', 'acai', 26.99, 28.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('acai-700g', 'AÇAÍ DE 31,99 (700G)', 'acai', 31.99, 34.99, 'AÇAÍ + 2 CREME + 5 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('acai-800g', 'AÇAÍ DE 34,99 (800G)', 'acai', 34.99, 36.99, 'AÇAÍ + 2 CREME + 5 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('acai-900g', 'AÇAÍ DE 38,99 (900G)', 'acai', 38.99, 41.99, 'AÇAÍ + 2 CREME + 5 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('milkshake-400ml', 'MILKSHAKE DE 400ML', 'milkshake', 11.99, 13.99, 'Milkshake cremoso de 400ml', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('milkshake-500ml', 'MILKSHAKE DE 500ML', 'milkshake', 12.99, 14.99, 'Milkshake cremoso de 500ml', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('vitamina-acai-400ml', 'VITAMINA DE AÇAÍ - 400ml', 'vitamina', 12.00, 14.00, 'Açaí, leite em pó em cada vitamina você pode escolher duas dessas opções sem custo.', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('vitamina-acai-500ml', 'VITAMINA DE AÇAÍ - 500ml', 'vitamina', 15.00, 17.00, 'Açaí, leite em pó em cada vitamina você pode escolher duas dessas opções sem custo.', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('acai-1kg', '1Kg de Açaí', 'acai', 44.99, null, 'Açaí tradicional vendido por peso - 1kg', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, true, 0.04499),
('sorvete-1kg', '1kg de Sorvete', 'sorvetes', 44.99, null, 'Sorvete tradicional 1kg', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, true, 0.04499)
ON CONFLICT (id) DO NOTHING;
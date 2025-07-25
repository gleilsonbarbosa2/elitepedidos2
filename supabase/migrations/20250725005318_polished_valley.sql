/*
  # Create delivery_products table

  1. New Tables
    - `delivery_products`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `category` (text, not null)
      - `price` (numeric, not null)
      - `original_price` (numeric, optional)
      - `description` (text, not null)
      - `image_url` (text, optional)
      - `is_active` (boolean, default true)
      - `is_weighable` (boolean, default false)
      - `price_per_gram` (numeric, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `delivery_products` table
    - Add policies for public read access
    - Add policies for authenticated users to insert/update/delete

  3. Triggers
    - Auto-update `updated_at` timestamp on changes
*/

CREATE TABLE IF NOT EXISTS delivery_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price numeric NOT NULL,
  original_price numeric,
  description text NOT NULL,
  image_url text,
  is_active boolean DEFAULT true NOT NULL,
  is_weighable boolean DEFAULT false NOT NULL,
  price_per_gram numeric,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE delivery_products ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Allow public read access to delivery_products"
  ON delivery_products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated insert to delivery_products"
  ON delivery_products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to delivery_products"
  ON delivery_products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete to delivery_products"
  ON delivery_products
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger to automatically update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $func$ language 'plpgsql';
  END IF;
END $$;

CREATE TRIGGER update_delivery_products_updated_at
  BEFORE UPDATE ON delivery_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial products from the existing data
INSERT INTO delivery_products (name, category, price, original_price, description, image_url, is_active, is_weighable, price_per_gram) VALUES
('Açaí Premium 300g', 'acai', 12.00, NULL, 'Açaí cremoso de alta qualidade com 300g', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL),
('Açaí Premium 500g', 'acai', 18.00, NULL, 'Açaí cremoso de alta qualidade com 500g', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL),
('Açaí Premium 700g', 'acai', 24.00, NULL, 'Açaí cremoso de alta qualidade com 700g', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL),
('Açaí Premium 1kg', 'acai', 32.00, NULL, 'Açaí cremoso de alta qualidade com 1kg', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL),
('Combo Açaí + Vitamina', 'combo', 25.00, 30.00, 'Açaí 500g + Vitamina de frutas', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL),
('Milkshake de Morango', 'milkshake', 15.00, NULL, 'Milkshake cremoso de morango', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL),
('Vitamina de Banana', 'vitamina', 12.00, NULL, 'Vitamina natural de banana com leite', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL),
('Sorvete de Chocolate', 'sorvetes', 8.00, NULL, 'Sorvete artesanal de chocolate', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL)
ON CONFLICT (id) DO NOTHING;
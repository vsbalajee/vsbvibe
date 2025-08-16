/*
  # Create app_templates table for project generation

  1. New Tables
    - `app_templates`
      - `id` (uuid, primary key)
      - `name` (text, template name)
      - `description` (text, template description)
      - `category` (text, template category)
      - `tech_stack_tags` (text array, technologies used)
      - `github_starter_repo_url` (text, starter repository URL)
      - `requires_url_input` (boolean, needs URL input like clones)
      - `icon_name` (text, lucide icon name for UI)
      - `is_active` (boolean, template availability)
      - `sort_order` (integer, display order)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `app_templates` table
    - Add policy for authenticated users to read templates
    - Add policy for service role to manage templates

  3. Sample Data
    - Insert 12 common web application templates
    - Include Website Clone option with URL requirement
*/

-- Create app_templates table
CREATE TABLE IF NOT EXISTS app_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  tech_stack_tags text[] DEFAULT '{}',
  github_starter_repo_url text,
  requires_url_input boolean DEFAULT false,
  icon_name text DEFAULT 'Code',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access to app_templates"
  ON app_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Allow service role to manage app_templates"
  ON app_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_templates_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_app_templates_updated_at ON app_templates;
CREATE TRIGGER update_app_templates_updated_at
  BEFORE UPDATE ON app_templates
  FOR EACH ROW EXECUTE FUNCTION update_app_templates_updated_at();

-- Insert sample app templates
INSERT INTO app_templates (name, description, category, tech_stack_tags, github_starter_repo_url, requires_url_input, icon_name, sort_order) VALUES
('One-Page Landing Page', 'A single-page website perfect for product launches, events, or simple portfolios with modern design and responsive layout.', 'Website', '{"React", "TypeScript", "Tailwind CSS", "Vite"}', 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts', false, 'Globe', 1),

('Multi-Page Business Website', 'A standard informational website for small businesses including About, Services, Contact pages with professional design.', 'Website', '{"React", "TypeScript", "Tailwind CSS", "React Router"}', 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts', false, 'Building2', 2),

('Basic Blog/Content Site', 'A simple platform for publishing articles with post listings, detail views, and content management capabilities.', 'Content', '{"React", "TypeScript", "Tailwind CSS", "Markdown"}', 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts', false, 'BookOpen', 3),

('Basic E-commerce Store', 'A foundational e-commerce site with product display, shopping cart functionality, and checkout process integration.', 'E-commerce', '{"React", "TypeScript", "Tailwind CSS", "Stripe"}', 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts', false, 'ShoppingCart', 4),

('Simple Dashboard/Admin Panel', 'A template for internal tools, data visualization, and managing application content with charts and tables.', 'Application', '{"React", "TypeScript", "Tailwind CSS", "Chart.js"}', 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts', false, 'BarChart3', 5),

('Basic CRUD App', 'A generic application for managing data such as task lists, contact managers, or simple inventory systems.', 'Application', '{"React", "TypeScript", "Tailwind CSS", "Supabase"}', 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts', false, 'Database', 6),

('Personal Portfolio Website', 'A dedicated site for showcasing individual work, skills, resume, and professional achievements.', 'Website', '{"React", "TypeScript", "Tailwind CSS", "Framer Motion"}', 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts', false, 'User', 7),

('Event/Conference Website', 'For managing event details, schedules, speakers, and basic registration forms with modern event layouts.', 'Website', '{"React", "TypeScript", "Tailwind CSS", "Calendar"}', 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts', false, 'Calendar', 8),

('Online Booking/Appointment System', 'A simple interface for users to book services or appointments with calendar integration and notifications.', 'Application', '{"React", "TypeScript", "Tailwind CSS", "Calendar", "Supabase"}', 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts', false, 'Clock', 9),

('Community Forum/Discussion Board', 'A basic platform for users to create topics, engage in discussions, and build community interactions.', 'Application', '{"React", "TypeScript", "Tailwind CSS", "Supabase"}', 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts', false, 'MessageSquare', 10),

('Newsletter Signup Page', 'A focused landing page designed solely for collecting email subscriptions with beautiful forms and analytics.', 'Website', '{"React", "TypeScript", "Tailwind CSS", "Email Service"}', 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts', false, 'Mail', 11),

('Website Clone', 'Replicate the static structure and assets of any existing website by providing its URL. Perfect for learning or creating similar designs.', 'Utility', '{"React", "TypeScript", "Tailwind CSS", "Web Scraping"}', 'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts', true, 'Copy', 12);
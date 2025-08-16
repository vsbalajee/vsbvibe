/*
  # Create app_templates table for project generation

  1. New Tables
    - `app_templates`
      - `id` (uuid, primary key)
      - `name` (text, template name)
      - `description` (text, template description)
      - `category` (text, template category)
      - `tech_stack_tags` (text[], technology tags)
      - `github_starter_repo_url` (text, optional starter repo)
      - `requires_url_input` (boolean, for clone templates)
      - `icon_name` (text, lucide icon name)
      - `is_active` (boolean, template visibility)
      - `sort_order` (integer, display order)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `app_templates` table
    - Add policy for authenticated users to read active templates
    - Add policy for service role to manage templates

  3. Sample Data
    - Insert 12 predefined templates including Website Clone
*/

-- Create the app_templates table
CREATE TABLE IF NOT EXISTS app_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tech_stack_tags TEXT[] DEFAULT '{}',
  github_starter_repo_url TEXT,
  requires_url_input BOOLEAN DEFAULT FALSE,
  icon_name TEXT DEFAULT 'Code',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE app_templates ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read active templates
CREATE POLICY "Allow authenticated read access to app_templates"
  ON app_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy for service role to manage templates (for admin purposes)
CREATE POLICY "Allow service role to manage app_templates"
  ON app_templates FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_app_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_app_templates_updated_at
  BEFORE UPDATE ON app_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_app_templates_updated_at();

-- Insert sample templates
INSERT INTO app_templates (name, description, category, tech_stack_tags, requires_url_input, icon_name, sort_order) VALUES
('One-Page Landing Page', 'A single-page website perfect for product launches, events, or simple portfolios with modern design and responsive layout.', 'Website', '{"React", "Tailwind CSS", "TypeScript", "Vite"}', false, 'Globe', 1),

('Multi-Page Business Website', 'A comprehensive business website with multiple pages including About, Services, Contact, and more. Perfect for small to medium businesses.', 'Website', '{"React", "Tailwind CSS", "TypeScript", "React Router"}', false, 'Building2', 2),

('Basic Blog/Content Site', 'A simple yet elegant blog platform for publishing articles with post listings, detail views, and content management capabilities.', 'Content', '{"React", "Tailwind CSS", "TypeScript", "Markdown"}', false, 'BookOpen', 3),

('Basic E-commerce Store', 'A foundational e-commerce site with product display, shopping cart functionality, and simulated checkout process.', 'E-commerce', '{"React", "Tailwind CSS", "TypeScript", "Context API"}', false, 'ShoppingCart', 4),

('Simple Dashboard/Admin Panel', 'A clean and intuitive dashboard template for internal tools, data visualization, and application content management.', 'Application', '{"React", "Tailwind CSS", "TypeScript", "Chart.js"}', false, 'BarChart3', 5),

('Basic CRUD App', 'A generic application for managing data such as task lists, contact managers, or simple inventory systems with full CRUD operations.', 'Application', '{"React", "Tailwind CSS", "TypeScript", "Local Storage"}', false, 'Database', 6),

('Personal Portfolio Website', 'A dedicated showcase site for individuals to display their work, skills, resume, and professional achievements.', 'Website', '{"React", "Tailwind CSS", "TypeScript", "Framer Motion"}', false, 'User', 7),

('Event/Conference Website', 'A comprehensive site for managing event details, schedules, speakers, and basic registration functionality.', 'Website', '{"React", "Tailwind CSS", "TypeScript", "Calendar"}', false, 'Calendar', 8),

('Online Booking/Appointment System', 'A user-friendly interface for booking services or appointments with calendar integration and time slot management.', 'Application', '{"React", "Tailwind CSS", "TypeScript", "Date Picker"}', false, 'Clock', 9),

('Community Forum/Discussion Board', 'A platform for users to create topics, engage in discussions, and build community with moderation features.', 'Application', '{"React", "Tailwind CSS", "TypeScript", "Real-time"}', false, 'MessageSquare', 10),

('Newsletter Signup Page', 'A focused landing page designed specifically for collecting email subscriptions with conversion optimization.', 'Content', '{"React", "Tailwind CSS", "TypeScript", "Form Validation"}', false, 'Mail', 11),

('Website Clone', 'Replicate the static structure and assets of any existing website into your own repository for customization and enhancement.', 'Utility', '{"React", "Tailwind CSS", "TypeScript", "Web Scraping"}', true, 'Copy', 12);
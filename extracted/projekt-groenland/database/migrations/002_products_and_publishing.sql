-- Product-based publishing system

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'subscription', 'single_ad'
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER,
  job_slots INTEGER,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  employer_id INTEGER REFERENCES employers(id),
  product_id INTEGER REFERENCES products(id),
  starts_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_employer ON subscriptions(employer_id);

ALTER TABLE jobs ADD COLUMN product_id INTEGER REFERENCES products(id);
ALTER TABLE jobs ADD COLUMN subscription_id INTEGER REFERENCES subscriptions(id);


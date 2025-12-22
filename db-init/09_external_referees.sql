SET search_path=crm,public;


CREATE TABLE external_referees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    referee_type VARCHAR(20) NOT NULL CHECK (referee_type IN ('doctor', 'patient')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on phone for faster lookups
CREATE INDEX idx_external_referees_phone ON external_referees(phone);

-- Create index on referee_type for filtering
CREATE INDEX idx_external_referees_type ON external_referees(referee_type);

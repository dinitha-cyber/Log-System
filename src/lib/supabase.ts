import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://thrcsmwvpvmlbkjdjnvo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocmNzbXd2cHZtbGJramRqbnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTc1MjUsImV4cCI6MjA5NDczMzUyNX0.xgSwmYrGCO8PPYiskXo8HllGHTeonrd_OdHPedsqGps'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

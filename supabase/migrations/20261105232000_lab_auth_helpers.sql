-- RLS and the invoker app guard call auth.uid()/auth.jwt().
-- Schema usage permits resolving those helpers; no auth table access is granted.
grant usage on schema auth to mnweb;

-- Create a view that joins user_feedback with profiles to show usernames
CREATE VIEW user_feedback_with_usernames AS
SELECT 
  uf.id,
  uf.user_id,
  uf.feedback_text,
  uf.created_at,
  p.username,
  COALESCE(upd.full_name, p.username) as display_name,
  p.role as user_role
FROM user_feedback uf
LEFT JOIN profiles p ON uf.user_id = p.id  
LEFT JOIN user_private_data upd ON uf.user_id = upd.id
ORDER BY uf.created_at DESC;

-- Grant select permissions on the view
GRANT SELECT ON user_feedback_with_usernames TO authenticated;
GRANT SELECT ON user_feedback_with_usernames TO service_role;
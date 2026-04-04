

## Fix Broken RLS Policy on `player_goals` INSERT

### Problem
The current INSERT policy has a self-referencing bug where `c.coach_id = c.coach_id AND c.student_id = c.student_id` always evaluates to true, allowing any coach to create goals for any student.

### Fix
Create a migration that drops and recreates the INSERT policy with the correct condition:

```sql
DROP POLICY "Coach can create goals for approved students" ON player_goals;

CREATE POLICY "Coach can create goals for approved students" ON player_goals
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = coach_id
  AND EXISTS (
    SELECT 1 FROM coach_student_connections c
    WHERE c.coach_id = auth.uid()
      AND c.student_id = player_goals.student_id
      AND c.status = 'approved'
  )
);
```

### Scope
- Single migration, no code changes needed
- Only the INSERT policy is affected; SELECT, UPDATE, DELETE policies are correct


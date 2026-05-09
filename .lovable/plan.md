## UI Cleanup in `src/pages/SessionForm.tsx`

1. **Session Name placeholder** (line 707): change `placeholder="e.g., Friday Cash Night"` → `placeholder=""`.
2. **First Table Name placeholder** (line 828): change `"e.g., Main Event, Table 5"` → `"e.g.,"`.
3. **Remove helper text** (line 835): delete the `FormDescription`/text "Leave blank to use the Session Name as the name for this table."
4. **Festival Name placeholder** (line 853): change `"e.g., WSOP, EPT, or Winter Series"` → `"e.g.,"`.

No other files or logic touched.
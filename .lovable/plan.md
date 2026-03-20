

## Add "Mark All as Read" Button to Notifications Header

### Change

In `src/pages/Notifications.tsx`:

1. **Replace the spacer div** (line 431) with a button using the `CheckCheck` icon, styled identically to the back button (same `variant="outline"`, `size="sm"`, green border/text)

2. **Add handler**: `handleMarkAllAsRead` that iterates through all unread `displayNotifications` and calls `markAsRead` on each, then shows a toast confirmation

3. **Disable state**: Button should be disabled when there are no unread notifications (all already read or list is empty)

### File to modify

**`src/pages/Notifications.tsx`**

- Add a `handleMarkAllAsRead` async function that filters unread notifications and calls `markAsRead` for each
- Replace line 431 (`<div className="w-9" />`) with:
```tsx
<Button
  onClick={handleMarkAllAsRead}
  variant="outline"
  size="sm"
  className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"
  disabled={displayNotifications.every(n => n.is_read) || displayNotifications.length === 0}
>
  <Icon name="CheckCheck" size={16} />
</Button>
```

Single file, minimal change.


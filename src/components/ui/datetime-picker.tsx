
import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface DateTimePickerProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "success"
  label?: string
}

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "Pick a date and time",
  disabled = false,
  className,
  badgeVariant = "default",
  label
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [timeValue, setTimeValue] = React.useState(() => {
    if (date) {
      return format(date, "HH:mm")
    }
    return "09:00"
  })

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Parse the current time value
      const [hours, minutes] = timeValue.split(':').map(Number)
      
      // Create new date with selected date and current time
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes, 0, 0)
      
      onDateChange(newDate)
    } else {
      onDateChange(undefined)
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime)
    
    if (date) {
      const [hours, minutes] = newTime.split(':').map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)
      onDateChange(newDate)
    }
  }

  const formatDateForBadge = (date: Date) => {
    return format(date, "dd MMM yyyy HH:mm")
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      <div className="flex items-center gap-3">
        <Badge 
          variant={badgeVariant}
          className={cn(
            "px-4 py-2 text-sm font-medium flex-1 justify-center min-w-0",
            badgeVariant === "success" && "bg-green-100 text-green-800 hover:bg-green-200",
            badgeVariant === "destructive" && "bg-red-100 text-red-800 hover:bg-red-200"
          )}
        >
          <span className="truncate">
            {date ? formatDateForBadge(date) : 'Not set'}
          </span>
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="px-3"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="center" className="w-full max-w-md mx-auto">
          <SheetHeader>
            <SheetTitle>Select Date & Time</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            <div>
              <Label className="text-sm font-medium mb-3 block">Date</Label>
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                className="rounded-md border"
              />
            </div>
            
            <div>
              <Label htmlFor="time" className="text-sm font-medium mb-2 block">
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={timeValue}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Button
              size="lg"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

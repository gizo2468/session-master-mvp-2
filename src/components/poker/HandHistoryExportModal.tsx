import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  fetchSessionsWithHandCounts,
  exportHandHistoryZip,
  getExportFileName,
  type SessionWithHandCount,
} from '@/utils/pt4HandHistoryExport';
import { toast } from 'sonner';

interface HandHistoryExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HandHistoryExportModal: React.FC<HandHistoryExportModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<SessionWithHandCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await fetchSessionsWithHandCounts(user.id, startDate, endDate);
      setSessions(result);
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, startDate, endDate]);

  useEffect(() => {
    if (open) fetchSessions();
  }, [open, fetchSessions]);

  const totalHands = sessions.reduce((sum, s) => sum + s.hand_count, 0);

  const handleExport = async () => {
    if (!user?.id || totalHands === 0) return;
    setExporting(true);
    try {
      const blob = await exportHandHistoryZip(user.id, startDate, endDate);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getExportFileName(startDate, endDate);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${totalHands} hands successfully`);
      onOpenChange(false);
    } catch (e: any) {
      console.error('Export failed:', e);
      toast.error(e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Hands (PT4)
          </DialogTitle>
        </DialogHeader>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal text-sm')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => d && setStartDate(d)}
                  disabled={(date) => date > endDate || date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal text-sm')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(endDate, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => d && setEndDate(d)}
                  disabled={(date) => date < startDate || date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Sessions List */}
        <div className="mt-2">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {loading ? 'Loading...' : `${sessions.length} session${sessions.length !== 1 ? 's' : ''} • ${totalHands} hand${totalHands !== 1 ? 's' : ''}`}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No hands found in selected date range
            </div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 text-sm"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium truncate">
                      {s.location || 'Session'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(s.start_time), 'MMM d, yyyy')} • {s.game_type} • {s.format}
                    </span>
                  </div>
                  <span className="ml-3 whitespace-nowrap font-semibold text-foreground">
                    {s.hand_count} hand{s.hand_count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            onClick={handleExport}
            disabled={exporting || totalHands === 0}
            className="w-full"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Hands ({totalHands})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HandHistoryExportModal;

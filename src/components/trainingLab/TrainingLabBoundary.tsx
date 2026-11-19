import { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default class TrainingLabBoundary extends Component<{ children: ReactNode; emptyText?: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: unknown) { console.error('Training Lab card failed', e); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Card className="mb-6 border-poker-gold/40">
        <CardHeader className="pb-3"><CardTitle className="text-center text-poker-gold">Training Lab</CardTitle></CardHeader>
        <CardContent><p className="text-center text-sm text-muted-foreground">{this.props.emptyText || 'No lesson summaries yet.'}</p></CardContent>
      </Card>
    );
  }
}

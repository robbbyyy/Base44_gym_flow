import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';

export default function ExpiringAlert({ members, renewals = [] }) {
  const navigate = useNavigate();
  const today = moment();
  const ago30 = today.clone().subtract(30, 'days');
  const in30 = today.clone().add(30, 'days');

  // Codici tessera già rinnovati (qualsiasi data)
  const renewedCodes = new Set(renewals.map(r => r.member_code));

  // Scaduti negli ultimi 30 giorni e non rinnovati
  const expired = members.filter(m => {
    if (!m.subscription_end) return false;
    const end = moment(m.subscription_end);
    return end.isBefore(today, 'day') && end.isAfter(ago30, 'day') && !renewedCodes.has(m.member_code);
  }).sort((a, b) => moment(b.subscription_end).diff(moment(a.subscription_end)));

  // In scadenza nei prossimi 30 giorni e non rinnovati
  const upcoming = members.filter(m => {
    if (!m.subscription_end) return false;
    const end = moment(m.subscription_end);
    return end.isSameOrAfter(today, 'day') && end.isBefore(in30, 'day') && !renewedCodes.has(m.member_code);
  }).sort((a, b) => moment(a.subscription_end).diff(moment(b.subscription_end)));

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Scadenze abbonamenti
            <span className="flex items-center gap-1.5 ml-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-destructive/15 text-destructive rounded-full px-2 py-0.5">
                <AlertTriangle className="w-3 h-3" />{expired.length}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-600 rounded-full px-2 py-0.5">
                <Clock className="w-3 h-3" />{upcoming.length}
              </span>
            </span>
          </CardTitle>
          <Link to="/expiring" className="text-xs text-primary hover:underline font-medium">
            Vedi tutte →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
          {expired.length === 0 && upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nessuna scadenza nei prossimi 30 giorni</p>
          )}

          {/* Sezione Scaduti */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-destructive mb-2 uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Scaduti ({expired.length})
            </p>
            {expired.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center bg-muted/30 rounded-lg">Nessun abbonamento scaduto</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {expired.map(m => {
                  const end = moment(m.subscription_end);
                  return (
                    <div key={m.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-destructive/5 border border-destructive/20">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{m.first_name} {m.last_name}</p>
                        <p className="text-[10px] text-muted-foreground">{end.format('DD/MM')}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] ml-2 flex-shrink-0 h-6 px-2 text-primary border-primary/40 hover:bg-primary/10"
                        onClick={() => navigate(`/members/${m.id}`)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />Rinnova
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Separatore */}
          <hr className="border-border mb-4" />

          {/* Sezione In Scadenza */}
          <div>
            <p className="text-xs font-semibold text-chart-3 mb-2 uppercase tracking-wide flex items-center gap-1">
              <Clock className="w-3 h-3" />
              In scadenza entro 30 giorni ({upcoming.length})
            </p>
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center bg-muted/30 rounded-lg">Nessuna scadenza nel prossimo mese</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {upcoming.map(m => {
                  const end = moment(m.subscription_end);
                  const daysLeft = end.diff(today, 'days');
                  return (
                    <div key={m.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-chart-3/5 border border-chart-3/20">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{m.first_name} {m.last_name}</p>
                        <p className="text-[10px] text-muted-foreground">{end.format('DD/MM')} · {daysLeft === 0 ? 'Oggi' : `${daysLeft}g`}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] ml-2 flex-shrink-0 h-6 px-2 text-primary border-primary/40 hover:bg-primary/10"
                        onClick={() => navigate(`/members/${m.id}`)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />Rinnova
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
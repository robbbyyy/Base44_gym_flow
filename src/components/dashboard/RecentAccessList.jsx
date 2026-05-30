import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScanLine, CalendarX2, FileText, Hash, ExternalLink, Trash2 } from 'lucide-react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

function DateBadge({ icon: Icon, label, date, warnDays = 30 }) {
  if (!date) return null;
  const m = moment(date);
  const daysLeft = m.diff(moment(), 'days');
  const expired = daysLeft < 0;
  const warning = !expired && daysLeft <= warnDays;

  let cls = 'bg-muted text-muted-foreground';
  if (expired) cls = 'bg-destructive/15 text-destructive border border-destructive/30';
  else if (warning) cls = 'bg-amber-50 text-amber-600 border border-amber-300';

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-md px-2 py-0.5 ${cls}`}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span>{label}</span>
      <span className="font-mono">{m.format('DD/MM/YY')}</span>
      {expired && <span className="ml-0.5 font-bold">⚠</span>}
    </span>
  );
}

export default function RecentAccessList({ logs, members = [], onReset }) {
  const navigate = useNavigate();
  const membersMap = Object.fromEntries(members.map(m => [m.id, m]));

  const todayLogs = logs.filter(log => moment(log.access_time).isSame(moment(), 'day'));

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            Accessi di Oggi ({todayLogs.length})
          </CardTitle>
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={todayLogs.length === 0}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Resetta Accessi Oggi
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-0 p-0 overflow-y-auto" style={{ maxHeight: '340px' }}>
        {todayLogs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nessun accesso oggi</p>
        )}
        {todayLogs.slice(0, 10).map((log) => {
          const member = log.member_id ? membersMap[log.member_id] : null;
          const isOk = log.status === 'autorizzato';
          return (
            <div
              key={log.id}
              onClick={() => member && navigate(`/members/${member.id}`)}
              className={`flex items-start gap-4 px-5 py-3.5 border-b border-border last:border-0 ${member ? 'cursor-pointer hover:bg-muted/40' : ''} ${
                !isOk
                  ? 'bg-destructive/5'
                  : member && member.subscription_end && moment(member.subscription_end).isSameOrAfter(moment(), 'day')
                    ? 'bg-green-50'
                    : ''
              }`}
            >
              {/* Status indicator */}
              <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOk ? 'bg-accent' : 'bg-destructive'}`} />

              <div className="flex-1 min-w-0">
                {/* Nome + codice + timestamp */}
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1.5">
                  <span className="text-sm font-bold text-foreground">{log.member_name || log.member_code}</span>
                  {member?.member_code && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                      <Hash className="w-3 h-3" />{member.member_code}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {moment(log.access_time).format('DD/MM/YYYY HH:mm')}
                  </span>
                </div>

                {/* Scadenze */}
                {member && (
                  <div className="flex flex-wrap gap-1.5">
                    <DateBadge icon={CalendarX2} label="Abbonamento" date={member.subscription_end} warnDays={30} />
                    <DateBadge icon={FileText} label="Cert. medico" date={member.medical_cert_expiry} warnDays={60} />
                  </div>
                )}

                {/* Motivo rifiuto */}
                {!isOk && log.denial_reason && (
                  <p className="text-xs text-destructive font-semibold mt-1.5">⚠ {log.denial_reason}</p>
                )}
              </div>

              {/* Badge stato + link scheda */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <Badge
                  variant={isOk ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {isOk ? 'OK' : 'Negato'}
                </Badge>
                {member && (
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
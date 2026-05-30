import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, AlertTriangle, Euro, TrendingUp, ScanLine } from 'lucide-react';
import moment from 'moment';

export default function DashboardStats({ members, renewals, todayAccessCount = 0 }) {
  const today = moment();
  const thisMonth = today.format('YYYY-MM');

  // Scadenze questo mese
  const expiringThisMonth = members.filter(m => {
    const end = m.subscription_end ? moment(m.subscription_end) : null;
    return end && end.format('YYYY-MM') === thisMonth;
  });
  const expiredCount = expiringThisMonth.filter(m => moment(m.subscription_end).isBefore(today, 'day')).length;
  const upcomingCount = expiringThisMonth.filter(m => !moment(m.subscription_end).isBefore(today, 'day')).length;

  // Rinnovi questo mese
  const renewalsThisMonth = renewals.filter(r => r.renewal_date && r.renewal_date.startsWith(thisMonth));
  const totalRinnovi = renewalsThisMonth.reduce((s, r) => s + (r.quota_versata || 0), 0);
  const totalIscrizioni = renewalsThisMonth.reduce((s, r) => s + (r.quota_iscrizione || 0), 0);

  const stats = [
    {
      label: 'Rinnovi questo mese',
      value: renewalsThisMonth.length,
      sub: `€${totalRinnovi.toFixed(2)} incassati`,
      icon: RefreshCw,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Iscrizioni questo mese',
      value: renewalsThisMonth.filter(r => r.quota_iscrizione > 0).length,
      sub: `€${totalIscrizioni.toFixed(2)} incassati`,
      icon: Euro,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Scadenze questo mese',
      value: expiringThisMonth.length,
      sub: `${expiredCount} scaduti · ${upcomingCount} in scadenza`,
      icon: AlertTriangle,
      color: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
    {
      label: 'Totale incassato mese',
      value: `€${(totalRinnovi + totalIscrizioni).toFixed(2)}`,
      sub: `${renewalsThisMonth.length} operazioni`,
      icon: TrendingUp,
      color: 'text-foreground',
      bg: 'bg-muted',
    },
    {
      label: 'Accessi oggi',
      value: todayAccessCount,
      sub: 'ingressi registrati',
      icon: ScanLine,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map(s => (
        <Card key={s.label} className="border-border">
          <CardContent className="p-4 flex items-start gap-3">
            <div className={`${s.bg} rounded-lg p-2 flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
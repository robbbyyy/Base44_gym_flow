import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import moment from 'moment';

export default function ActiveMembersDonut({ members }) {
  const today = moment();
  const active = members.filter(m => m.status === 'attivo' && moment(m.subscription_end).isAfter(today)).length;
  const expiring = members.filter(m => {
    const end = moment(m.subscription_end);
    return m.status === 'attivo' && end.isAfter(today) && end.diff(today, 'days') <= 30;
  }).length;
  const expired = members.filter(m => !m.subscription_end || moment(m.subscription_end).isBefore(today)).length;
  const suspended = members.filter(m => m.status === 'sospeso').length;

  const data = [
    { name: 'Attivi', value: Math.max(active - expiring, 0), color: 'hsl(160,60%,45%)' },
    { name: 'In scadenza', value: expiring, color: 'hsl(35,90%,55%)' },
    { name: 'Scaduti', value: expired, color: 'hsl(0,72%,55%)' },
    { name: 'Sospesi', value: suspended, color: 'hsl(220,13%,70%)' },
  ].filter(d => d.value > 0);

  const total = members.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          Stato Membri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" strokeWidth={0}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-bold text-foreground">{total}</p>
              <p className="text-xs text-muted-foreground">totale</p>
            </div>
          </div>
          <div className="space-y-2 flex-1">
            {data.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </span>
                <span className="font-semibold text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
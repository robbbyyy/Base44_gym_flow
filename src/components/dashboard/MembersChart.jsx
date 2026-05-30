import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users } from 'lucide-react';
import moment from 'moment';

export default function MembersChart({ members }) {
  // New members per month (last 6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const m = moment().subtract(i, 'months');
    months.push({
      label: m.format('MMM'),
      month: m.format('YYYY-MM'),
      nuovi: 0,
      rinnovi: 0,
    });
  }

  members.forEach(m => {
    if (!m.created_date) return;
    const key = moment(m.created_date).format('YYYY-MM');
    const slot = months.find(x => x.month === key);
    if (!slot) return;
    // If subscription_start differs from created_date by > 30d, count as rinnovo
    if (m.subscription_start && moment(m.subscription_start).diff(moment(m.created_date), 'days') > 30) {
      slot.rinnovi++;
    } else {
      slot.nuovi++;
    }
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm space-y-1">
          <p className="font-semibold text-foreground capitalize">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" />
          Nuovi Iscritti &amp; Rinnovi — Ultimi 6 Mesi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={months} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,90%)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="nuovi" name="Nuovi" fill="hsl(160,60%,45%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rinnovi" name="Rinnovi" fill="hsl(220,80%,55%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-accent" />Nuovi iscritti</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-primary" />Rinnovi</span>
        </div>
      </CardContent>
    </Card>
  );
}
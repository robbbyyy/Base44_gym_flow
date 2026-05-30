import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import moment from 'moment';

export default function AccessChart({ logs }) {
  // Build last 14 days
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = moment().subtract(i, 'days');
    days.push({
      label: d.format('DD/MM'),
      date: d.format('YYYY-MM-DD'),
      ingressi: 0,
    });
  }

  logs.forEach(log => {
    if (log.status !== 'autorizzato') return;
    const d = moment(log.access_time).format('YYYY-MM-DD');
    const day = days.find(x => x.date === d);
    if (day) day.ingressi++;
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
          <p className="font-semibold text-foreground">{label}</p>
          <p className="text-primary">{payload[0].value} ingressi</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Ingressi Giornalieri — Ultimi 14 Giorni
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={days} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="colorIngressi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220,80%,50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(220,80%,50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,90%)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="ingressi"
              stroke="hsl(220,80%,50%)"
              strokeWidth={2.5}
              fill="url(#colorIngressi)"
              dot={{ r: 3, fill: 'hsl(220,80%,50%)', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
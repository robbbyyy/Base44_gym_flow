import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import moment from 'moment';

const COLORS = ['hsl(220,80%,50%)', 'hsl(160,60%,45%)', 'hsl(0,72%,55%)'];

export default function RenewalsPieChart({ members, renewals }) {
  const today = moment();
  const thisMonth = today.format('YYYY-MM');

  const renewalsThisMonth = renewals.filter(r => r.renewal_date?.startsWith(thisMonth));

  // Rinnovi = renewals senza quota_iscrizione (solo rinnovo abbonamento)
  const rinnoviCount = renewalsThisMonth.filter(r => !r.quota_iscrizione || r.quota_iscrizione === 0).length;

  // Nuove iscrizioni = renewals con quota_iscrizione > 0
  const nuoveIscrizioniCount = renewalsThisMonth.filter(r => r.quota_iscrizione > 0).length;

  // Scaduti da rinnovare = membri con abbonamento scaduto e non rinnovati questo mese
  const renewedCodes = new Set(renewalsThisMonth.map(r => r.member_code));
  const scadutiDaRinnovare = members.filter(m => {
    const end = m.subscription_end ? moment(m.subscription_end) : null;
    return end && end.isBefore(today, 'day') && !renewedCodes.has(m.member_code);
  }).length;

  const data = [
    { name: 'Rinnovi eseguiti', value: rinnoviCount },
    { name: 'Nuove iscrizioni', value: nuoveIscrizioniCount },
    { name: 'Scaduti da rinnovare', value: scadutiDaRinnovare },
  ].filter(d => d.value > 0);

  const hasData = data.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
          <PieIcon className="w-4 h-4" /> Situazione Abbonamenti — {moment().format('MMMM YYYY')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            Nessun dato disponibile per questo mese
          </div>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
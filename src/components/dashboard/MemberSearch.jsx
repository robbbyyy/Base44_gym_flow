import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, User, ArrowRight, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import moment from 'moment';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

export default function MemberSearch({ members }) {
  const [query, setQuery] = useState('');
  const [turnstileCode, setTurnstileCode] = useState('');
  const [turnstileResult, setTurnstileResult] = useState(null);
  const navigate = useNavigate();

  const logMutation = useMutation({
    mutationFn: (data) => base44.entities.AccessLog.create(data),
  });

  const handleTurnstileCheck = async () => {
    const code = turnstileCode.trim();
    if (!code) return;
    const member = members.find(m => m.member_code?.toLowerCase() === code.toLowerCase());
    const now = moment().toISOString();

    if (!member) {
      setTurnstileResult({ type: 'error', message: 'Tessera non riconosciuta' });
      await logMutation.mutateAsync({ member_code: code, access_time: now, status: 'negato', denial_reason: 'Tessera non trovata', access_type: 'ingresso' });
    } else if (member.subscription_end && moment(member.subscription_end).isBefore(moment(), 'day')) {
      setTurnstileResult({ type: 'error', message: `${member.first_name} ${member.last_name} — Abbonamento scaduto` });
      await logMutation.mutateAsync({ member_id: member.id, member_name: `${member.first_name} ${member.last_name}`, member_code: code, access_time: now, status: 'negato', denial_reason: 'Abbonamento scaduto', access_type: 'ingresso' });
    } else {
      setTurnstileResult({ type: 'success', message: `${member.first_name} ${member.last_name} — Accesso autorizzato` });
      await logMutation.mutateAsync({ member_id: member.id, member_name: `${member.first_name} ${member.last_name}`, member_code: code, access_time: now, status: 'autorizzato', access_type: 'ingresso' });
    }
    setTurnstileCode('');
    setTimeout(() => setTurnstileResult(null), 4000);
  };

  const found = query.trim().length >= 2
    ? members.filter(m =>
        m.member_code?.toLowerCase().includes(query.toLowerCase()) ||
        m.badge_number?.toLowerCase().includes(query.toLowerCase()) ||
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-primary">
          <Search className="w-5 h-5" />
          Ricerca Iscritto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:border-primary font-mono"
            placeholder="N° tessera, badge o nome..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        {found.length > 0 && (
          <div className="space-y-1.5">
            {found.map(m => {
              const subEnd = m.subscription_end ? moment(m.subscription_end) : null;
              const isExpired = subEnd ? subEnd.isBefore(moment(), 'day') : false;
              const daysLeft = subEnd ? subEnd.diff(moment(), 'days') : null;
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(`/members/${m.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {m.photo_url
                      ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" />
                      : <User className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{m.first_name} {m.last_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{m.member_code}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {daysLeft !== null && (
                      <p className={`text-xs font-semibold ${isExpired ? 'text-destructive' : daysLeft <= 30 ? 'text-chart-3' : 'text-accent'}`}>
                        {isExpired ? 'Scaduto' : `${daysLeft}gg`}
                      </p>
                    )}
                    <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 ml-auto" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {query.trim().length >= 2 && found.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-3">Nessun iscritto trovato</p>
        )}

        {/* Verifica Tessera Tornello */}
        <div className="border-t border-border pt-3 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            Verifica Tessera Tornello
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:border-primary font-mono"
              placeholder="N° tessera..."
              value={turnstileCode}
              onChange={e => setTurnstileCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTurnstileCheck()}
            />
            <Button size="sm" onClick={handleTurnstileCheck} disabled={!turnstileCode.trim()}>
              Verifica
            </Button>
          </div>
          {turnstileResult && (
            <div className={`mt-2 flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${turnstileResult.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {turnstileResult.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
              {turnstileResult.message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Check, Euro, CreditCard, Banknote } from 'lucide-react';
import moment from 'moment';

const SUBSCRIPTION_DURATIONS = {
  mensile: 1,
  trimestrale: 3,
  semestrale: 6,
  annuale: 12,
  giornaliero: 0,
};

const DEFAULT_QUOTES = {
  mensile: 40,
  trimestrale: 100,
  semestrale: 200,
  annuale: 300,
  giornaliero: 0,
};

const SUB_TYPES = ['mensile', 'trimestrale', 'semestrale', 'annuale', 'giornaliero'];

export default function RenewalPanel({ member }) {
  const queryClient = useQueryClient();
  const [subType, setSubType] = useState(member.subscription_type || 'mensile');
  const [quotaRinnovo, setQuotaRinnovo] = useState(String(DEFAULT_QUOTES[member.subscription_type || 'mensile']));
  const [quotaIscrizione, setQuotaIscrizione] = useState('');
  const [annualFee, setAnnualFee] = useState(member.annual_fee ? String(member.annual_fee) : '25');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('contanti');
  const [done, setDone] = useState(false);
  const [doneAnnual, setDoneAnnual] = useState(false);
  const [annualPaymentMethod, setAnnualPaymentMethod] = useState('contanti');

  const updateMember = useMutation({
    mutationFn: (data) => base44.entities.Member.update(member.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['access-logs-member', member.id] });
    },
  });

  const createRenewal = useMutation({
    mutationFn: (data) => base44.entities.DailyRenewal.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daily-renewals'] }),
  });

  const handleRenew = async (fromToday = false) => {
    const today = moment();
    // Se fromToday=true forza partenza da oggi, altrimenti estende dalla scadenza attuale se attivo
    const base = (!fromToday && member.subscription_end && moment(member.subscription_end).isAfter(today))
      ? moment(member.subscription_end)
      : today;

    const months = SUBSCRIPTION_DURATIONS[subType];
    const newEnd = months > 0 ? base.clone().add(months, 'months') : today.clone().add(1, 'day');

    await updateMember.mutateAsync({
      subscription_type: subType,
      subscription_start: today.format('YYYY-MM-DD'),
      subscription_end: newEnd.format('YYYY-MM-DD'),
      status: 'attivo',
      annual_fee: parseFloat(annualFee) || member.annual_fee || 0,
    });

    await createRenewal.mutateAsync({
      last_name: member.last_name,
      first_name: member.first_name,
      member_code: member.member_code,
      quota_versata: parseFloat(quotaRinnovo) || 0,
      quota_iscrizione: parseFloat(quotaIscrizione) || 0,
      payment_method: paymentMethod,
      renewal_date: today.format('YYYY-MM-DD'),
      notes: notes || `Rinnovo ${subType}`,
    });

    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  const handleRenewAnnual = async () => {
    const today = moment();
    const base = member.membership_end && moment(member.membership_end).isAfter(today)
      ? moment(member.membership_end)
      : today;
    const newEnd = base.clone().add(12, 'months');

    await updateMember.mutateAsync({
      membership_start: today.format('YYYY-MM-DD'),
      membership_end: newEnd.format('YYYY-MM-DD'),
      annual_fee: parseFloat(annualFee) || 25,
    });

    await createRenewal.mutateAsync({
      last_name: member.last_name,
      first_name: member.first_name,
      member_code: member.member_code,
      quota_versata: 0,
      quota_iscrizione: parseFloat(annualFee) || 25,
      payment_method: annualPaymentMethod,
      renewal_date: today.format('YYYY-MM-DD'),
      notes: `Rinnovo iscrizione annuale — nuova scadenza ${newEnd.format('DD/MM/YYYY')}`,
    });

    setDoneAnnual(true);
    setTimeout(() => setDoneAnnual(false), 3000);
  };

  const isPending = updateMember.isPending || createRenewal.isPending;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-primary">
          <RefreshCw className="w-5 h-5" />
          Rinnova / Cambia Abbonamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo abbonamento */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Tipo abbonamento</label>
          <div className="flex flex-wrap gap-2">
            {SUB_TYPES.map(t => (
              <button
                key={t}
                onClick={() => { setSubType(t); setQuotaRinnovo(String(DEFAULT_QUOTES[t])); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  subType === t
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-foreground hover:bg-muted'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Quota rinnovo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Euro className="w-3.5 h-3.5" /> Quota rinnovo
            </label>
            <input
              type="number" min="0" step="0.01"
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:border-primary"
              placeholder="0.00"
              value={quotaRinnovo}
              onChange={e => setQuotaRinnovo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Euro className="w-3.5 h-3.5" /> Quota iscrizione (opzionale)
            </label>
            <input
              type="number" min="0" step="0.01"
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:border-primary"
              placeholder="0.00"
              value={quotaIscrizione}
              onChange={e => setQuotaIscrizione(e.target.value)}
            />
          </div>
        </div>

        {/* Metodo pagamento */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Metodo di pagamento</label>
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod('contanti')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${paymentMethod === 'contanti' ? 'bg-accent text-accent-foreground border-accent' : 'bg-background border-border hover:bg-muted'}`}
            >
              <Banknote className="w-4 h-4" /> Contanti
            </button>
            <button
              onClick={() => setPaymentMethod('pos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${paymentMethod === 'pos' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}
            >
              <CreditCard className="w-4 h-4" /> POS
            </button>
          </div>
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Note (opzionale)</label>
          <input
            className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:border-primary"
            placeholder="Es. rinnovo anticipato, cambio disciplina..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Preview nuova scadenza */}
        {subType !== 'giornaliero' && (
          <p className="text-xs text-muted-foreground">
            Nuova scadenza: <strong className="text-foreground">
              {(() => {
                const base = member.subscription_end && moment(member.subscription_end).isAfter(moment())
                  ? moment(member.subscription_end)
                  : moment();
                return base.clone().add(SUBSCRIPTION_DURATIONS[subType], 'months').format('DD/MM/YYYY');
              })()}
            </strong>
            {member.subscription_end && moment(member.subscription_end).isAfter(moment()) && (
              <span className="ml-1 text-accent">(esteso dalla scadenza attuale)</span>
            )}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleRenew(false)} disabled={isPending || done} className="w-full sm:w-auto">
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvataggio...</>
            ) : done ? (
              <><Check className="w-4 h-4 mr-2" /> Rinnovo registrato!</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" /> Conferma rinnovo</>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRenew(true)}
            disabled={isPending || done}
            className="w-full sm:w-auto border-chart-3 text-chart-3 hover:bg-chart-3/10"
            title="Rinnova partendo dalla data di oggi (ignora la scadenza attuale)"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Rinnova da oggi
          </Button>
        </div>

        {/* Sezione Iscrizione Annuale */}
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Iscrizione Annuale</p>
          {member.membership_end && (
            <p className="text-xs text-muted-foreground">
              Scadenza attuale: <strong className={`${moment(member.membership_end).isBefore(moment(), 'day') ? 'text-destructive' : 'text-foreground'}`}>
                {moment(member.membership_end).format('DD/MM/YYYY')}
              </strong>
              {' · '}Nuova scadenza: <strong className="text-foreground">
                {(member.membership_end && moment(member.membership_end).isAfter(moment())
                  ? moment(member.membership_end)
                  : moment()
                ).clone().add(12, 'months').format('DD/MM/YYYY')}
              </strong>
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Euro className="w-3.5 h-3.5" /> Quota iscrizione annuale
              </label>
              <input
                type="number" min="0" step="0.01"
                className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:border-primary"
                placeholder="25.00"
                value={annualFee}
                onChange={e => setAnnualFee(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Metodo pagamento</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAnnualPaymentMethod('contanti')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${annualPaymentMethod === 'contanti' ? 'bg-accent text-accent-foreground border-accent' : 'bg-background border-border hover:bg-muted'}`}
                >
                  <Banknote className="w-3.5 h-3.5" /> Contanti
                </button>
                <button
                  onClick={() => setAnnualPaymentMethod('pos')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${annualPaymentMethod === 'pos' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> POS
                </button>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleRenewAnnual}
            disabled={isPending || doneAnnual}
            className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvataggio...</>
            ) : doneAnnual ? (
              <><Check className="w-4 h-4 mr-2" /> Iscrizione rinnovata!</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" /> Rinnova iscrizione annuale</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
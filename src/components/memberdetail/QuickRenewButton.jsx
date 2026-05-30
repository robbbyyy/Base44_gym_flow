import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Check, Zap } from 'lucide-react';
import moment from 'moment';

const SUBSCRIPTION_DURATIONS = {
  mensile: 1,
  trimestrale: 3,
  semestrale: 6,
  annuale: 12,
  giornaliero: 0,
};

export default function QuickRenewButton({ member }) {
  const queryClient = useQueryClient();
  const [done, setDone] = useState(false);

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

  const handleQuickRenew = async () => {
    const today = moment();
    const base = member.membership_end && moment(member.membership_end).isAfter(today)
      ? moment(member.membership_end)
      : today;

    const newEnd = base.clone().add(12, 'months');

    await updateMember.mutateAsync({
      membership_start: today.format('YYYY-MM-DD'),
      membership_end: newEnd.format('YYYY-MM-DD'),
      status: 'attivo',
    });

    await createRenewal.mutateAsync({
      last_name: member.last_name,
      first_name: member.first_name,
      member_code: member.member_code,
      quota_versata: member.annual_fee || 0,
      quota_iscrizione: 0,
      payment_method: 'contanti',
      renewal_date: today.format('YYYY-MM-DD'),
      notes: `Rinnovo rapido iscrizione annuale — nuova scadenza ${newEnd.format('DD/MM/YYYY')}`,
    });

    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  const isPending = updateMember.isPending || createRenewal.isPending;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleQuickRenew}
      disabled={isPending || done}
      className={done ? 'border-accent text-accent' : 'border-primary text-primary hover:bg-primary/10'}
    >
      {isPending ? (
        <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Rinnovo...</>
      ) : done ? (
        <><Check className="w-3.5 h-3.5 mr-1.5" /> Rinnovato!</>
      ) : (
        <><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Rinnovo</>
      )}
    </Button>
  );
}
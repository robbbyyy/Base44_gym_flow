import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Fetch all current access logs
        const logs = await base44.asServiceRole.entities.AccessLog.list(null, 5000);

        if (logs.length > 0) {
            console.log(`Archiving ${logs.length} access logs...`);

            // Archive them
            const toArchive = logs.map(log => ({
                member_id: log.member_id || null,
                member_name: log.member_name || null,
                member_code: log.member_code,
                access_time: log.access_time,
                access_type: log.access_type || 'ingresso',
                status: log.status,
                denial_reason: log.denial_reason || null,
            }));

            await base44.asServiceRole.entities.ArchivedAccessLog.bulkCreate(toArchive);
            console.log(`Archived ${toArchive.length} logs.`);

            // Delete originals
            await Promise.all(logs.map(log => base44.asServiceRole.entities.AccessLog.delete(log.id)));
            console.log(`Deleted ${logs.length} logs from AccessLog.`);
        } else {
            console.log('No logs to archive.');
        }

        return Response.json({ status: 'success', archived: logs.length });
    } catch (error) {
        console.error('Archive error:', error.message);
        return Response.json({ status: 'error', message: error.message }, { status: 500 });
    }
});
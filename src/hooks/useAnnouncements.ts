import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminActionLogger } from './useAdminActionLogger';

export interface Announcement {
    id: string;
    title: string;
    content: string;
    target_audience: string;
    notice_type: string;
    class_id: string | null;
    created_by: string;
    is_approved: boolean | null;
    expires_at: string | null;
    created_at: string;
    is_read?: boolean;
}

export function useAnnouncements() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { logAction } = useAdminActionLogger();

    const { data, isLoading, error } = useQuery({
        queryKey: ['announcements'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notices')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []) as unknown as Announcement[];
        },
    });

    const createAnnouncement = useMutation({
        mutationFn: async (input: {
            title: string;
            content: string;
            target_audience?: string;
            notice_type?: string;
            expires_at?: string;
        }) => {
            const { data, error } = await supabase
                .from('notices')
                .insert({
                    title: input.title,
                    content: input.content,
                    target_audience: input.target_audience || 'all',
                    notice_type: input.notice_type || 'announcement',
                    created_by: user?.id || '',
                    is_approved: true,
                    expires_at: input.expires_at || null,
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            logAction({ actionType: 'CREATE', module: 'Announcements', recordAffected: 'New announcement posted' });
            toast.success('Announcement posted');
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const updateAnnouncement = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Announcement> & { id: string }) => {
            const { data, error } = await supabase
                .from('notices')
                .update(updates as any)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success('Announcement updated');
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const deleteAnnouncement = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('notices')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success('Announcement deleted');
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const toggleActive = useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            const { error } = await supabase
                .from('notices')
                .update({ is_approved: is_active })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success('Announcement status updated');
        },
        onError: (e: Error) => toast.error(e.message),
    });

    return {
        announcements: data || [],
        isLoading,
        error,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        toggleActive,
    };
}

/** Get active announcements (approved notices) visible to the current user */
export function useActiveAnnouncements() {
    const { role } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ['active-announcements', role],
        queryFn: async () => {
            const now = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('notices')
                .select('*')
                .eq('is_approved', true)
                .or(`expires_at.is.null,expires_at.gt.${now}`)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            return (data || []).map(n => ({
                ...n,
                is_read: false,
            })) as unknown as Announcement[];
        },
        staleTime: 30000,
    });

    const markAsRead = useMutation({
        mutationFn: async (_announcementId: string) => {
            // No-op: notices table doesn't have read tracking
        },
    });

    return {
        announcements: (data || []) as Announcement[],
        isLoading,
        markAsRead,
        unreadCount: (data || []).length,
    };
}

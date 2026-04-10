import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type TableName =
  | 'student_attendance'
  | 'teacher_attendance'
  | 'homework'
  | 'homework_submissions'
  | 'issues'
  | 'notifications'
  | 'events'
  | 'teachers'
  | 'students'
  | 'classes'
  | 'timetable'
  | 'salary_records'
  | 'profiles'
  | 'user_roles'
  | 'teacher_leaves'
  | 'student_remarks'
  | 'notices'
  | 'student_documents'
  | 'activity_logs'
  | 'email_logs'
  | 'teacher_documents';

interface UseRealtimeSubscriptionOptions {
  table: TableName;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onChange?: () => void;
}

let channelCounter = 0;

export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  onChange,
}: UseRealtimeSubscriptionOptions) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Stable unique ID per hook instance
  const instanceId = useRef(++channelCounter);

  useEffect(() => {
    const channelName = `rt-${table}-${instanceId.current}`;

    const channelConfig: {
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema: string;
      table: string;
      filter?: string;
    } = {
      event,
      schema: 'public',
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        channelConfig,
        () => {
          onChangeRef.current?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter]);
}

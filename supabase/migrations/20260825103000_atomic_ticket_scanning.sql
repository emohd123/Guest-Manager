create or replace function public.process_ticket_scan(
  p_event_id uuid,
  p_company_id uuid,
  p_barcode text,
  p_raw_barcode text default null,
  p_action text default 'check_in',
  p_method text default 'scan',
  p_user_id uuid default null,
  p_device_id text default null,
  p_device_name text default null,
  p_client_mutation_id text default null,
  p_qr_expires_at timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_ticket tickets%rowtype;
  v_guest guests%rowtype;
  v_scan_id uuid;
  v_response jsonb;
  v_result text;
  v_status text;
  v_scan_type text;
  v_expires_at timestamptz;
  v_other_ticket boolean := false;
  v_duplicate boolean := false;
begin
  if p_action not in ('check_in', 'checkout') then
    raise exception 'Unsupported scan action';
  end if;
  if p_method not in ('scan', 'search', 'manual', 'walkup') then
    raise exception 'Unsupported scan method';
  end if;

  if p_device_id is not null and p_client_mutation_id is not null then
    select response_hash::jsonb into v_response
    from mobile_mutation_dedup
    where event_id = p_event_id
      and device_id = p_device_id
      and client_mutation_id = p_client_mutation_id
    limit 1;
    if v_response is not null then
      return v_response;
    end if;
  end if;

  <<workflow>>
  begin
    select * into v_event
    from events
    where id = p_event_id and company_id = p_company_id and deleted_at is null
    limit 1;

    if not found then
      insert into scans(company_id,event_id,device_id,scanned_by,scan_type,method,barcode,result,notes,device_info)
      values (p_company_id,p_event_id,p_device_id,p_user_id,'invalid'::scan_type,p_method::scan_method,
        coalesce(p_raw_barcode,p_barcode),'not_found','Event not found or scanner is not authorised for this event',
        jsonb_build_object('deviceId',p_device_id,'deviceName',p_device_name)) returning id into v_scan_id;
      v_response := jsonb_build_object('status','invalid','result','not_found','ticketId',null,'guestId',null,
        'attendeeName',null,'attendanceState',null,'scanType','invalid','scanId',v_scan_id);
      exit workflow;
    end if;

    v_expires_at := coalesce(p_qr_expires_at, v_event.ends_at at time zone 'UTC', v_event.starts_at at time zone 'UTC');

    select * into v_ticket
    from tickets
    where event_id = p_event_id and barcode = p_barcode
    limit 1
    for update;

    if not found then
      select exists(select 1 from tickets where barcode = p_barcode) into v_other_ticket;
      v_result := case when v_other_ticket then 'wrong_event' else 'not_found' end;
      insert into scans(company_id,event_id,device_id,scanned_by,scan_type,method,barcode,result,notes,device_info)
      values (p_company_id,p_event_id,p_device_id,p_user_id,'invalid'::scan_type,p_method::scan_method,
        coalesce(p_raw_barcode,p_barcode),v_result,
        case when v_other_ticket then 'Ticket belongs to another event' else null end,
        jsonb_build_object('deviceId',p_device_id,'deviceName',p_device_name)) returning id into v_scan_id;
      v_response := jsonb_build_object('status','invalid','result',v_result,'ticketId',null,'guestId',null,
        'attendeeName',null,'attendanceState',null,'scanType','invalid','scanId',v_scan_id);
      exit workflow;
    end if;

    if v_expires_at is not null and now() >= v_expires_at then
      insert into scans(company_id,event_id,ticket_id,device_id,scanned_by,scan_type,method,barcode,result,notes,device_info)
      values (p_company_id,p_event_id,v_ticket.id,p_device_id,p_user_id,'invalid'::scan_type,p_method::scan_method,
        v_ticket.barcode,'expired','Expired at ' || v_expires_at::text,
        jsonb_build_object('deviceId',p_device_id,'deviceName',p_device_name)) returning id into v_scan_id;
      v_response := jsonb_build_object('status','invalid','result','expired','ticketId',v_ticket.id,
        'guestId',v_ticket.guest_id,'attendeeName',v_ticket.attendee_name,'attendanceState',null,
        'scanType','invalid','scanId',v_scan_id,'expiresAt',v_expires_at);
      exit workflow;
    end if;

    if v_ticket.status not in ('valid'::ticket_status,'used'::ticket_status) then
      v_result := case when v_ticket.status = 'voided'::ticket_status then 'voided' else 'invalid_status' end;
      insert into scans(company_id,event_id,ticket_id,device_id,scanned_by,scan_type,method,barcode,result,device_info)
      values (p_company_id,p_event_id,v_ticket.id,p_device_id,p_user_id,'invalid'::scan_type,p_method::scan_method,
        v_ticket.barcode,v_result,jsonb_build_object('deviceId',p_device_id,'deviceName',p_device_name)) returning id into v_scan_id;
      v_response := jsonb_build_object('status','invalid','result',v_result,'ticketId',v_ticket.id,
        'guestId',v_ticket.guest_id,'attendeeName',v_ticket.attendee_name,'attendanceState',null,
        'scanType','invalid','scanId',v_scan_id);
      exit workflow;
    end if;

    if v_ticket.guest_id is not null then
      select * into v_guest from guests where id = v_ticket.guest_id and event_id = p_event_id limit 1 for update;
    end if;

    if p_action = 'checkout' then
      v_duplicate := (v_guest.id is not null and v_guest.attendance_state = 'checked_out'::attendance_state)
        or (not coalesce(v_ticket.checked_in,false) and (v_guest.id is null or v_guest.attendance_state <> 'checked_in'::attendance_state));
      if v_duplicate then
        v_result := case when v_guest.id is not null and v_guest.attendance_state = 'checked_out'::attendance_state
          then 'revalidated' else 'not_checked_in' end;
        v_status := case when v_result = 'revalidated' then 'revalidated' else 'invalid' end;
      else
        update tickets set checked_in=false, updated_at=now() where id=v_ticket.id;
        if v_guest.id is not null then
          update guests set status='confirmed'::guest_status,checked_out_at=now(),attendance_state='checked_out'::attendance_state,updated_at=now()
          where id=v_guest.id;
        end if;
        v_result := 'checked_out'; v_status := 'success';
      end if;
      v_scan_type := 'checkout';
      insert into scans(company_id,event_id,ticket_id,device_id,scanned_by,scan_type,method,barcode,result,device_info)
      values(p_company_id,p_event_id,v_ticket.id,p_device_id,p_user_id,'checkout'::scan_type,p_method::scan_method,
        v_ticket.barcode,v_result,jsonb_build_object('deviceId',p_device_id,'deviceName',p_device_name)) returning id into v_scan_id;
      insert into check_ins(company_id,event_id,ticket_id,guest_id,device_id,device_name,action,method,scanned_barcode,is_duplicate,notes,performed_by)
      values(p_company_id,p_event_id,v_ticket.id,v_ticket.guest_id,p_device_id,p_device_name,'check_out'::check_in_action,
        p_method::check_in_method,v_ticket.barcode,v_duplicate,case when v_duplicate then v_result else null end,p_user_id);
      v_response := jsonb_build_object('status',v_status,'result',v_result,'ticketId',v_ticket.id,
        'guestId',v_ticket.guest_id,'attendeeName',v_ticket.attendee_name,
        'attendanceState',case when v_guest.id is null then null when v_duplicate then v_guest.attendance_state::text else 'checked_out' end,
        'scanType',v_scan_type,'scanId',v_scan_id);
      exit workflow;
    end if;

    v_duplicate := coalesce(v_ticket.checked_in,false)
      or (v_guest.id is not null and v_guest.attendance_state = 'checked_in'::attendance_state);
    if v_duplicate then
      v_result := 'revalidated'; v_status := 'revalidated';
    else
      update tickets set checked_in=true,checked_in_at=now(),checked_in_by=p_user_id,status='used'::ticket_status,updated_at=now()
      where id=v_ticket.id;
      if v_guest.id is not null then
        update guests set status='checked_in'::guest_status,checked_in_at=now(),checked_out_at=null,
          attendance_state='checked_in'::attendance_state,updated_at=now() where id=v_guest.id;
      end if;
      v_result := 'success'; v_status := 'success';
    end if;
    insert into scans(company_id,event_id,ticket_id,device_id,scanned_by,scan_type,method,barcode,result,device_info)
    values(p_company_id,p_event_id,v_ticket.id,p_device_id,p_user_id,'check_in'::scan_type,p_method::scan_method,
      v_ticket.barcode,v_result,jsonb_build_object('deviceId',p_device_id,'deviceName',p_device_name)) returning id into v_scan_id;
    insert into check_ins(company_id,event_id,ticket_id,guest_id,device_id,device_name,action,method,scanned_barcode,is_duplicate,notes,performed_by)
    values(p_company_id,p_event_id,v_ticket.id,v_ticket.guest_id,p_device_id,p_device_name,'check_in'::check_in_action,
      p_method::check_in_method,v_ticket.barcode,v_duplicate,case when v_duplicate then 'revalidated' else null end,p_user_id);
    v_response := jsonb_build_object('status',v_status,'result',v_result,'ticketId',v_ticket.id,
      'guestId',v_ticket.guest_id,'attendeeName',v_ticket.attendee_name,
      'attendanceState',case when v_guest.id is null then null else 'checked_in' end,
      'scanType','check_in','scanId',v_scan_id);
  end workflow;

  if p_device_id is not null and p_client_mutation_id is not null then
    insert into mobile_mutation_dedup(device_id,event_id,client_mutation_id,response_hash)
    values(p_device_id,p_event_id,p_client_mutation_id,v_response::text)
    on conflict(device_id,client_mutation_id) do update set response_hash=excluded.response_hash;
  end if;
  return v_response;
end;
$$;

revoke all on function public.process_ticket_scan(uuid,uuid,text,text,text,text,uuid,text,text,text,timestamptz) from public;
grant execute on function public.process_ticket_scan(uuid,uuid,text,text,text,text,uuid,text,text,text,timestamptz) to service_role;

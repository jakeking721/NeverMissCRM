-- Helper script to create storage bucket for form uploads
insert into storage.buckets (id, name, public)
select 'form-uploads', 'form-uploads', false
where not exists (select 1 from storage.buckets where id = 'form-uploads');

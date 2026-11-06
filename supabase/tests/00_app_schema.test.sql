begin;
create extension if not exists pgtap with schema extensions;

select plan(3);

select has_schema('app', 'the private helper schema exists');

select ok(
  has_schema_privilege('authenticated', 'app', 'usage'),
  'authenticated can use app so policies can call its helpers'
);

select ok(
  not has_schema_privilege('authenticated', 'app', 'create'),
  'nobody but the owner creates objects in app'
);

select * from finish();
rollback;

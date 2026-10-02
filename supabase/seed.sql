-- Villa Hamsa - seed checklist. Hanya berjalan jika tabel areas masih kosong.
do $$
declare
  data jsonb := '[
    {"name":"Dapur","note":null,"items":["Meja Makan","Gas atau Kompor","Dispenser","Kulkas","Meja Dapur","Cuci Piring","Lantai","Kondisi Sampah"]},
    {"name":"Kolam","note":null,"items":["Kondisi Air","Kondisi Sekitar Kolam","Kondisi Sampah"]},
    {"name":"Ruang Tamu Depan","note":null,"items":["Kursi","Meja","Kondisi Sampah"]},
    {"name":"Ruang Tamu Tengah","note":null,"items":["Setup Meja 1 TV","Setup Meja 2 Depan Aquarium","Kondisi Sampah"]},
    {"name":"Mini Bar","note":null,"items":["Meja","Kursi","Tata Letak Barang","Cermin","Wastafel","Kondisi Sampah"]},
    {"name":"Kamar 1","note":"Cek sprei & sarung bantal","items":["Kasur 1","Kasur 2","Kasur 3","Kasur 4","Dipan + Cermin Dipan","Jendela","Kamar Mandi","Lantai","Kondisi Sampah"]},
    {"name":"Ruang Aquarium","note":null,"items":["Aquarium","Dipan Aquarium"]},
    {"name":"Ruang Billiard","note":null,"items":["Meja Billiard","Kursi","Meja","Kondisi Sampah"]},
    {"name":"Kamar 4","note":null,"items":["Kasur 1","Kasur 2","Kasur 3","Kasur 4","Meja + Cermin Depan","Jendela","Lantai","Kondisi Sampah","Kamar Mandi","Lantai Kamar Mandi","Cermin + Wastafel"]},
    {"name":"Toilet Depan","note":null,"items":["Toilet 1","Toilet 2"]},
    {"name":"Kamar 2","note":null,"items":["Kasur 1","Kasur 2","Kasur 3","Jendela","Lantai","Kondisi Sampah"]},
    {"name":"Kamar 3","note":null,"items":["Kasur 1","Jendela","Lantai","Kondisi Sampah"]},
    {"name":"Lantai 2","note":null,"items":["Tangga","Kursi","Meja","Kondisi Sampah","Dipan"]},
    {"name":"Kamar 7","note":null,"items":["Kasur 1","Kasur 2","Kasur 3","Balkon","Jendela","Lantai","Kondisi Sampah"]},
    {"name":"Kamar 6","note":null,"items":["Kasur 1","Kasur 2","Jendela","Lantai","Kondisi Sampah"]},
    {"name":"Kamar Mandi Atas","note":null,"items":["Cermin","Wastafel"]},
    {"name":"Kamar 5","note":null,"items":["Kasur 1","Kasur 2","Kasur 3","Kasur 4","Kasur 5","Kasur 6","Cermin","Dipan","Jendela","Kamar Mandi","Balkon","Kondisi Sampah"]},
    {"name":"Aula Dalam","note":null,"items":["Kondisi Sampah","Meja","Kursi"]},
    {"name":"Aula Luar","note":null,"items":["Lantai","Kondisi Sampah","Balkon"]}
  ]'::jsonb;
  a record;
  it record;
  new_area_id uuid;
begin
  if exists (select 1 from areas) then
    raise notice 'Tabel areas sudah berisi data, seed dilewati.';
    return;
  end if;

  for a in select value, ordinality as n from jsonb_array_elements(data) with ordinality loop
    insert into areas (name, note, sort_order)
    values (a.value->>'name', a.value->>'note', a.n::int)
    returning id into new_area_id;

    for it in select value as v, ordinality as n from jsonb_array_elements_text(a.value->'items') with ordinality loop
      insert into items (area_id, name, sort_order) values (new_area_id, it.v, it.n::int);
    end loop;
  end loop;
end $$;

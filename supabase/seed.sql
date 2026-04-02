-- Seed data for 8 initial municipalities
INSERT INTO municipalities (slug, name, province, phone, website, address, agent_name, enabled)
VALUES
  ('vicente-lopez', 'Vicente López', 'Buenos Aires', '(011) 4510-5000', 'https://www.vicentelopez.gov.ar', 'Av. Maipú 2609', 'Asistente de Vicente López', true),
  ('san-isidro', 'San Isidro', 'Buenos Aires', '(011) 4512-3131', 'https://www.sanisidro.gob.ar', '9 de Julio 2150', 'Asistente de San Isidro', true),
  ('moron', 'Morón', 'Buenos Aires', '(011) 4489-5500', 'https://www.moron.gob.ar', 'Almirante Brown 901', 'Asistente de Morón', true),
  ('la-plata', 'La Plata', 'Buenos Aires', '(0221) 427-6691', 'https://www.laplata.gob.ar', 'Calle 12 entre 51 y 53', 'Asistente de La Plata', true),
  ('lanus', 'Lanús', 'Buenos Aires', '(011) 4241-7070', 'https://www.lanus.gob.ar', 'Av. Hipólito Yrigoyen 3863', 'Asistente de Lanús', true),
  ('general-rodriguez', 'General Rodríguez', 'Buenos Aires', '(0237) 484-0054', 'https://www.generalrodriguez.gob.ar', 'Av. Pres. Perón 635', 'Asistente de General Rodríguez', true),
  ('ameghino', 'Florentino Ameghino', 'Buenos Aires', '(0336) 449-1000', 'https://www.ameghino.gob.ar', 'Av. Mitre 200', 'Asistente de Ameghino', true),
  ('tigre', 'Tigre', 'Buenos Aires', '(011) 4512-7800', 'https://www.tigre.gob.ar', 'Av. Cazón 1514', 'Asistente de Tigre', true)
ON CONFLICT (slug) DO NOTHING;

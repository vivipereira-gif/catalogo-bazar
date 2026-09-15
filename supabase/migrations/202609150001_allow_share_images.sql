-- As capas sociais são JPEGs 1200x630 armazenados junto às mídias do produto.
update storage.buckets
set allowed_mime_types = array['image/webp', 'image/jpeg', 'video/mp4']
where id = 'product-media';

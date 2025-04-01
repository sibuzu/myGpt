docker run -d ^
  -p 12345:12345 ^
  -v D:\gtpImages:/app/images ^
  -v %cd%\log:/app/log ^
  --env-file .env ^
  --name my-gpt-api ^
  my-gpt-api
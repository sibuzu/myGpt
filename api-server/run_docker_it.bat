docker run -it ^
  -p 12345:12345 ^
  -v D:\gtpImages:/app/images ^
  -v D:\missav:/app/missav ^
  -v %cd%\log:/app/log ^
  --env-file .env ^
  --name my-gpt-api ^
  my-gpt-api
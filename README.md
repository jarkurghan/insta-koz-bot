# insta-koz-bot

Instagram blogerlarining yangi postlarini Playwright orqali tekshirib, Telegram chatga yuboradigan bot. Ubuntu serverda Docker orqali ishlaydi.

## Lokal (Windows)

`npm run dev` Node orqali ishlaydi. Windowsda Bun Playwright brauzeriga ulanolmaydi, shuning uchun lokal ishga tushirish `tsx` bilan.

Kompyuterda Google Chrome o'rnatilgan bo'lishi kerak. `.env` ni to'ldiring, so'ng:

```bash
npm run dev
```

## Docker

1. `.env.example` ni `.env` ga nusxalang va to'ldiring.
2. Image ni yig'ib, konteynerni ishga tushiring:

```bash
docker compose up -d --build
```

3. Logni ko'ring:

```bash
docker compose logs -f
```

Blogerlar `src/utils/bloggers.json` da, `@` siz:

```json
["cristiano", "natgeo", "nasa"]
```

Birinchi aylanishda mavjud postlar saqlanadi, xabar ketmaydi. Keyin yangi post chiqsa `NOTIFY_CHAT_ID` ga link yuboriladi.

Windowsda bot o'rnatilgan Google Chrome dan foydalanadi. Docker (Linux) ichida Playwright Chromium ishlatiladi.

Sessiya va ko'rilgan postlar `./data` da saqlanadi. Image qayta yig'ilsa ham login qayta so'ralmaydi.

Instagram checkpoint so'rasa, bot parolni qayta yubormaydi va `LOG_CHAT_ID` ga yozadi.

## Buyruqlar

- `/start` — kuzatilayotgan blogerlar soni va yoqish/o'chirish tugmalari
- `/status` — holat, oxirgi aylanish vaqti va xato
- `Kuzatuvni yoqish` / `Kuzatuvni o'chirish` — istalgan foydalanuvchi kuzatuvni boshqaradi. Har bir o'zgarish `LOG_CHAT_ID` ga kim qilgani bilan yoziladi. Ishga tushganda kuzatuv yoniq bo'ladi.

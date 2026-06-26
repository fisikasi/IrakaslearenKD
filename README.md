# Irakaslearen Kuadernoa PWA

React + Vite + Supabase bidez egindako lehen MVP-a.

## Martxan jartzeko

1. Sortu Supabase proiektua.
2. Authentication > Providers > Email aktibatu.
3. Email confirmation desaktibatu, lehen MVP honetan ez baita behar.
4. SQL Editor-en exekutatu `supabase/schema.sql`.
5. Kopiatu `.env.example` fitxategia `.env` izenarekin eta bete balioak.
6. Instalatu eta abiatu:

```bash
npm install
npm run dev
```

## Lehen funtzioak

- Erabiltzaile/pasahitz bidez saioa hasi.
- Klaseak sortu.
- Klase egitura bikoiztu, ikaslerik kopiatu gabe.
- Ikasleak eskuz gehitu.
- Ikasleak Excel bidez gehitu. Zutabe gomendatuak: `ABIZENA` eta `IZENA`.
- Ebaluazio tresnak sortu.
- Kalifikazio irizpideak ikusi/editatu.
- Ikaslearen fitxa ireki eta KE/EI egitura ikusi.
- Base legalaren orria.

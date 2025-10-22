# 🚀 Brevo (Sendinblue) Kurulum Rehberi

## 1️⃣ Brevo API Key'inizi Alın

1. [Brevo Dashboard](https://app.brevo.com/) adresine gidin
2. Sağ üstte profilinize tıklayın → **SMTP & API**
3. **API Keys** sekmesine gidin
4. **Create a new API key** butonuna tıklayın
5. Bir isim verin (örn: "CRM System")
6. API Key'i kopyalayın ⚠️ **BU BİR DAHA GÖSTERİLMEYECEK!**

## 2️⃣ API Key'i Sisteme Ekleyin

`server.js` dosyasını açın ve şu satırı bulun:

```javascript
const BREVO_API_KEY = 'xkeysib-YOUR_API_KEY_HERE';
```

`YOUR_API_KEY_HERE` kısmını kopyaladığınız API key ile değiştirin:

```javascript
const BREVO_API_KEY = 'xkeysib-abc123def456...';
```

## 3️⃣ Email Servisini Seçin

`server.js` dosyasında şu satırı bulun:

```javascript
const EMAIL_SERVICE = 'brevo'; // 'brevo' veya 'gmail'
```

- **Brevo kullanmak için:** `'brevo'` bırakın (varsayılan)
- **Gmail'e geri dönmek için:** `'gmail'` yapın

## 4️⃣ Sender Email'i Doğrulayın

Brevo'da kullanacağınız gönderici email adresini doğrulamanız gerekiyor:

1. [Brevo Senders](https://app.brevo.com/senders) sayfasına gidin
2. **Add a sender** butonuna tıklayın
3. Email adresinizi girin (`beyza.yildirim158@gmail.com`)
4. Gelen doğrulama emailindeki linke tıklayın

## 5️⃣ Sunucuyu Başlatın

```bash
npm start
```

## 📊 Brevo vs Gmail Karşılaştırma

| Özellik | Brevo (Ücretsiz) | Gmail |
|---------|------------------|-------|
| **Günlük Limit** | 300 mail | 500 mail |
| **Hız** | Çok hızlı (saniyede 10+) | Yavaş (saniyede 1) |
| **Rate Limiting** | Yok | Çok sıkı |
| **Engelleme Riski** | Düşük | Yüksek |
| **Batch Delay** | Gerek yok | 5 saniye gerekli |
| **API Kullanımı** | Modern REST API | SMTP |

## ✅ Test Edin

1. CRM'inize gidin: http://localhost:3000
2. Bir test maili gönderin
3. Konsolu kontrol edin:
   - ✓ [Brevo] Email sent to... göreceksiniz
   - Hata varsa burada görünür

## 🔄 Gmail'e Geri Dönmek

Eğer Brevo ile sorun yaşarsanız, `server.js` içinde:

```javascript
const EMAIL_SERVICE = 'gmail';
```

yapın ve sunucuyu yeniden başlatın.

## 🆘 Sorun Giderme

### "Invalid API key" hatası:
- API key'i doğru kopyaladığınızdan emin olun
- `xkeysib-` ile başlamalı

### "Sender not verified" hatası:
- Brevo dashboard'dan email adresinizi doğrulayın

### "Daily quota exceeded" hatası:
- Günlük 300 mail limitini aştınız
- Yarın tekrar deneyin veya ücretli plana geçin

## 📈 Ücretsiz Planı Yükseltmek

Daha fazla mail göndermek için:
1. [Brevo Pricing](https://www.brevo.com/pricing/) sayfasına gidin
2. **Starter Plan**: 20,000 mail/ay - €25/ay
3. **Business Plan**: 40,000 mail/ay - €39/ay

## 🎯 Avantajlar

✅ Gmail'den 10x daha hızlı  
✅ Engelleme riski yok  
✅ Profesyonel email gönderimi  
✅ Detaylı istatistikler  
✅ Türkçe destek  


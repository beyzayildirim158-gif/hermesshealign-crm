# 📧 Tsoft 1posta.com Kurulum Rehberi

## 🎯 Tsoft Nedir?

Tsoft, Türk Telekom altyapısını kullanan profesyonel bir kurumsal email servisidir. 1posta.com domainini kullanır ve Türkiye'de güvenilir bir email çözümüdür.

## ✅ Avantajları

- ✅ **Türk Telekom altyapısı** - Yerel, güvenilir
- ✅ **Yüksek limit** - Gmail'den çok daha fazla mail
- ✅ **Hızlı gönderim** - Saniyede 5+ mail
- ✅ **Kurumsal görünüm** - Profesyonel email sistemi
- ✅ **Spam riski düşük** - Türkiye'de tanınan bir servis

## 🔧 Kurulum Adımları

### 1️⃣ Email Bilgilerinizi Hazırlayın

Tsoft'tan aldığınız bilgiler:
- **Email Adresi**: örn. `sifre@1posta.com`
- **Şifre**: Email hesabınızın şifresi
- **SMTP Sunucusu**: `smtp.1posta.com`
- **Port**: `587` (TLS) veya `465` (SSL)

### 2️⃣ server.js Dosyasını Düzenleyin

`server.js` dosyasını açın ve **19-25. satırlardaki** bilgileri güncelleyin:

```javascript
// Email Service Configuration
const EMAIL_SERVICE = 'tsoft'; // 'tsoft' olarak ayarlayın

// Tsoft (1posta.com - Telekom) SMTP Configuration
const TSOFT_CONFIG = {
    host: 'smtp.1posta.com',
    port: 587, // veya 465 SSL için
    secure: false, // port 465 ise true yapın
    user: 'sizin@1posta.com', // 👈 BURAYA EMAIL ADRESİNİZİ GİRİN
    password: 'sizin_sifreniz' // 👈 BURAYA ŞİFRENİZİ GİRİN
};
```

### 3️⃣ Port Ayarları

**Port 587 (TLS) kullanıyorsanız:**
```javascript
port: 587,
secure: false
```

**Port 465 (SSL) kullanıyorsanız:**
```javascript
port: 465,
secure: true
```

### 4️⃣ Sunucuyu Başlatın

```bash
npm start
```

## 📊 Performans Karşılaştırması

| Özellik | Tsoft | Brevo | Gmail |
|---------|-------|-------|-------|
| **Günlük Limit** | Çok yüksek | 300 | 100 |
| **Hız** | ⚡⚡ Hızlı | ⚡⚡ Hızlı | 🐌 Yavaş |
| **Batch Boyutu** | 50 mail | 50 mail | 10 mail |
| **Mail Arası Bekleme** | 200ms | 100ms | 1500ms |
| **Batch Arası Bekleme** | 2 saniye | Yok | 5 saniye |
| **Engelleme Riski** | ❌ Yok | ❌ Yok | ✅ Var |
| **Türkiye Optimizasyonu** | ✅ Mükemmel | ⚠️ Orta | ⚠️ Orta |

## 🚀 Hız Örneği

**100 mail göndermek için süre:**
- **Tsoft**: ~40 saniye
- **Brevo**: ~10 saniye
- **Gmail**: ~3-4 dakika

## 🔐 Güvenlik Notları

1. **Şifrenizi güvende tutun** - `server.js` dosyasını paylaşmayın
2. **Git'e yüklemeyin** - `.gitignore` dosyasına `server.js` ekleyin
3. **Environment variables kullanın** (gelişmiş kullanıcılar için)

## 🆘 Sorun Giderme

### "Invalid login" hatası
- Email adresi ve şifrenizi kontrol edin
- 1posta.com hesabınıza web'den giriş yapabildiğinizi doğrulayın

### "Connection timeout" hatası
- Port numarasını kontrol edin (587 veya 465)
- `secure` ayarını kontrol edin (587=false, 465=true)
- Firewall'unuzu kontrol edin

### "Sender address rejected" hatası
- Gönderici email adresinin 1posta.com domaini olduğundan emin olun
- `user` alanında doğru email'i kullanın

## 🔄 Diğer Servislere Geçiş

### Brevo'ya geçmek için:
```javascript
const EMAIL_SERVICE = 'brevo';
```

### Gmail'e geçmek için:
```javascript
const EMAIL_SERVICE = 'gmail';
```

## 📧 Test Etme

1. Sunucuyu başlatın: `npm start`
2. http://localhost:3000 adresine gidin
3. Kendinize bir test maili gönderin
4. Konsolu kontrol edin:
   ```
   ✓ [Tsoft] Email sent to test@example.com (1/1)
   ```

## 💡 İpuçları

1. **Toplu gönderimde** Tsoft çok hızlıdır, batch sistemini kullanın
2. **Kurumsal email** için en iyi seçenek
3. **Türkiye'de** spam filtreleri tarafından güvenilir
4. **Limit sorunu** yaşamak istemiyorsanız ideal

## 📞 Tsoft Destek

Sorun yaşarsanız Tsoft destek ekibiyle iletişime geçin:
- Web: https://www.1posta.com
- Destek: Tsoft müşteri hizmetleri

## ✨ Başarılı Kurulum

Konsol çıktısı şöyle görünmeli:
```
Server running at http://localhost:3000
✓ [Tsoft] Email sent to user1@example.com (1/100)
✓ [Tsoft] Email sent to user2@example.com (2/100)
⏳ Batch complete. Waiting 2 seconds before next batch...
✓ [Tsoft] Email sent to user51@example.com (51/100)
```

Başarılar! 🎉

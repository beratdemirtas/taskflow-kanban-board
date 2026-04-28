# TaskFlow - Kanban Board

## Projenin Senaryosu

Küçük bir yazılım ekibi, Trello benzeri basit ama etkili bir görev yönetim aracına ihtiyaç duyuyor. Ekip üyeleri görevleri sütunlar arasında sürükleyerek durumunu güncelleyebilmeli.

## Kullanılan Teknolojiler

- Next.js 15
- Tailwind CSS
- dnd-kit
- Clerk Auth

## Neden dnd-kit?

- Piyasadaki en hafif ve modüler kütüphane olduğu için dnd-kit'i seçtim. hello-pangea gibi eski mimarileri veya tarayıcının yavaş native API'larını eledim. Mobildeki kaydırma ile sürükleme çakışmasını, PointerSensor üzerinden 10px'lik bir tolerans tanımlayarak çözdüm. Bu sayede uygulama dokunmatik ekranlarda "takılmadan" çalışıyor.

## Neden Clerk?

Projeyi geliştirirken kullanıcı giriş-çıkış sistemini sıfırdan kodlamak yerine Clerk kullanmaya karar verdim. Bunun birkaç temel sebebi var:

- 48 saatlik kısıtlı bir sürem olduğu için, login formları tasarlamak yerine Kanban mantığına ve kullanıcı deneyimine odaklanmayı seçtim.
- Kendi yazacağım basit bir auth sistemi yerine, profesyonel ve endüstri standardı bir yapı kullanarak Google Login gibi özellikleri saniyeler içinde güvenli bir şekilde entegre ettim.
- Next.js App Router ile en uyumlu çalışan yapı bu. Middleware sayesinde sayfa korumalarını ve kullanıcı bazlı yönlendirmeleri karmaşık kod yığınlarına girmeden, temiz bir şekilde halletmiş oldum..

## Mobil Uyumluluk ve Sıralama Mantığı

Uygulamanın hem masaüstünde hem de mobilde akıcı hissettirmesi için sürükleme dinamiklerini cihaz bazlı özelleştirdim:

- Mobilde kullanıcı sayfayı aşağı kaydırmak isterken yanlışlıkla kartları tutmasın diye 180ms gecikme ve 8px tolerans tanımladım. Yani kısa dokunuşlar sayfayı kaydırırken, bilinçli bir uzun basma sürüklemeyi başlatıyor. Masaüstünde ise 6px'lik bir hareket eşiğiyle yanlışlıkla sürüklemeleri eledim.
- Ekran boyutuna göre otomatik değişen bir yapı kurdum; mobilde alt alta, masaüstünde yan yana dizilen sütunlar sayesinde her ekranda tam verim alınıyor.
- Kartı bir sütunun üzerine bıraktığınızda en sona ekleniyor, başka bir kartın üzerine bıraktığınızda ise tam araya yerleşiyor. Boş sütunları da her zaman "bırakılabilir" (droppable) tutarak akışın kopmamasını sağladım.
- Kartın her noktası sürükleme alanı olarak çalışıyor, ancak düzenleme butonunu ayırarak yanlış tıklamaların önüne geçtim. Sürükleme anındaki görünüm (overlay) ile orijinal kart birebir aynı olduğu için kullanıcı neyi nereye koyduğunu net bir şekilde görüyor.
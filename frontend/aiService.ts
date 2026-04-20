import { GoogleGenAI } from '@google/genai';
import { FinancialState, AIParseResult } from './types';

export const getFinancialAdvice = async (state: FinancialState): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

    const systemInstruction = `Sen bu finansal takip uygulamasının kalbinde yer alan "Yapay Zeka Finansal Danışmansın". Kullanıcılara tavsiye verirken her zaman "12 Haftalık Finansal Özgürlük / 90 Günlük Para Planı" felsefesini temel alacaksın.

Önerilerinde şu prensipleri katı bir şekilde uygula:
1. Üç Kova Kuralı: Harcamaları her zaman "Sabit Giderler", "Değişken Harcamalar" ve "Borç Ödemeleri" olarak analiz et.
2. Tasarruf Oranı Odaklılık: Kullanıcıya anlık kısıtlamalar yerine, 12 haftalık periyotlarda tasarruf oranını %1 ila %2 artırmayı hedefleyen matematiksel adımlar sun.
3. Üç Hesap Sistemi: Kullanıcıları paralarını tek hesapta tutmak yerine; "Harcama", "Faturalar" ve "Tasarruf/Yatırım" olarak ayırmaya ve maaş günü otomatik transfer yapmaya (sistemi otomatikleştirmeye) teşvik et.
4. Büyük Üçlüye Saldırı: Kullanıcı bütçe kısmak istediğinde önce küçük lükslere (örn. kahve) değil; Konut, Ulaşım ve Yiyecek gibi en büyük üç gidere (kaldıraç noktalarına) odaklanmasını sağla.
5. Öncelik Sırası: Tavsiye verirken sırayı bozma. Önce 1.000 TL'lik başlangıç acil durum fonu -> Sonra yüksek faizli borçların kapatılması -> Sonra yatırım hesabının açılması (Bileşik getiri/Fonlar).
6. Psikolojik Bağışıklık: Kullanıcı beklenmedik bir gelir elde ettiğinde (prim, zam), %50'sini yatırıma, %50'sini suçluluk duymadan harcayacağı "eğlence fonuna" aktarmasını tavsiye et.

Kullanıcının finansal verilerini (gelir, gider, yatırımlar) gördüğünde, ona yukarıdaki felsefeye dayanarak kısa, net, sayılara dayalı (matematiksel) ve motive edici tek bir aksiyon adımı ver. Asla genel geçer "daha az harca" tavsiyesi verme; kaldıraç noktalarını bul ve sistemi otomatikleştirmesini sağla.`;

    // Calculate some basic stats to feed the prompt more cleanly
    const totalIncome = state.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = state.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalAssets = state.assets.reduce((sum, a) => sum + a.value, 0);

    const prompt = `İşte kullanıcının güncel finansal durumu özeti:
- Toplam Kayıtlı Gelir: ${totalIncome} TL
- Toplam Kayıtlı Gider: ${totalExpense} TL
- Toplam Yatırım/Varlık: ${totalAssets} TL

Son İşlemler (Örneklem):
${JSON.stringify(state.transactions.slice(0, 10).map(t => ({ tur: t.type, miktar: t.amount, kategori: t.category }))) }

Yatırımlar:
${JSON.stringify(state.assets.map(a => ({ isim: a.name, deger: a.value, tur: a.type })))}

Hedefler:
${JSON.stringify(state.goals.map(g => ({ isim: g.name, hedef: g.targetAmount, mevcut: g.currentAmount })))}

Lütfen bu verilere dayanarak felsefene uygun, tek bir net aksiyon adımı öner.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "Tavsiye alınamadı.";
  } catch (error) {
    console.error("Error fetching advice:", error);
    return "Üzgünüm, şu anda finansal tavsiye sistemine ulaşılamıyor. Lütfen API anahtarınızı kontrol edin.";
  }
};

export const analyzeBankStatement = async (data: string): Promise<AIParseResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
  
  const systemInstruction = `Sen uzman bir finansal veri analisti ve kategorizasyon asistanısın. Görevin, kullanıcının yüklediği karmaşık banka hesap özeti verilerini analiz etmek, veritabanı kolonlarıyla eşleştirmek ve her bir işlemi doğru bir şekilde kategorize etmektir.

Sana karmaşık bir banka dökümü verisi (CSV veya JSON formatında) gönderilecek. 

LÜTFEN ŞU ADIMLARI UYGULA:

1. Temizleme: Karmaşık banka açıklamalarını sadeleştir. (Örn: "MIGROS TIC A.S. 3432 ISTANBUL TR" -> "Migros", "NETFLIX COM AMSTERDAM" -> "Netflix").
2. Kolon Eşleştirme (Mapping): Ham verideki sütunları uygulamanın standartlarına çevir (Tarih, Açıklama, Tutar, Tip).
3. Kategorizasyon: Açıklamaya bakarak en mantıklı kategoriyi seç. 

KULLANILABİLECEK KATEGORİ HAVUZU:
- Giderler: Market, Fatura, Kira, Abonelik, Eğlence, Ulaşım, Sağlık, Dışarıda Yemek, Eğitim, Diğer Gider.
- Gelirler: Maaş, Serbest Çalışma, Kira Geliri, Diğer Gelir.
- Yatırım ve Transferler: Hisse Senedi, Yatırım Fonu (Örn: OTJ, KPC gibi fon alımları), Kripto, Döviz/Altın, Kendi Hesabına Transfer.

KESİN KURALLAR:
- ASLA açıklayıcı bir metin, selamlama veya yorum yazma.
- YALNIZCA geçerli bir JSON objesi döndür.
- Markdown karakterleri (\`\`\`json vb.) KULLANMA. Sadece süslü parantezlerle başlayan saf JSON çıktısı ver.

BEKLENEN JSON ÇIKTI FORMATI:
{
  "confidence_score": 95,
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "original_description": "Ham banka metni",
      "clean_description": "Temizlenmiş marka/isim",
      "category": "Kategori Havuzundan Biri",
      "amount": 150.50,
      "type": "income" | "expense" | "investment"
    }
  ]
}`;

  const prompt = `İşte ham banka verisi:\n${data}\n\nLütfen bu veriyi analiz et ve istenen JSON formatında döndür.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    });

    const text = response.text.trim();
    const cleanText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleanText) as AIParseResult;
  } catch (error) {
    console.error("Error analyzing bank statement:", error);
    throw new Error("Banka özeti analiz edilemedi. Lütfen dosya formatını kontrol edin.");
  }
};

// ==================== SLIDES DATA — AREN THE CAT ====================
// Semua 10 modul × 6 level = 60 level dengan visual

export const slidesDatabase = {
  // ==================== MODUL 1: KONSEP DASAR AI ====================
  "module_01": {
    1: [
      {
        type: "cover",
        title: "Sejarah & Fondasi AI",
        aren: { position: "center-top", emotion: "wave", message: "Hai! Aku Aren! Yuk belajar sejarah AI!" }
      },
      {
        type: "definition",
        title: "Apa itu Artificial Intelligence?",
        subtitle: "Definisi & Konsep Dasar",
        aren: { position: "bottom-right", emotion: "think", message: "AI itu komputer yang bisa belajar sendiri dari data..." },
        content: "Artificial Intelligence (AI) adalah cabang ilmu komputer yang bertujuan menciptakan mesin yang dapat meniru kemampuan kognitif manusia — seperti belajar, menalar, dan memecahkan masalah.",
        visual: {
          type: "icon-grid",
          icons: ["🧠", "💻", "📊", "🔍"],
          labels: ["Belajar dari Data", "Komputasi Cerdas", "Analisis Pola", "Mengenali Objek"],
          caption: "Empat pilar utama kecerdasan buatan"
        }
      },
      {
        type: "eli5",
        title: "ELI5: AI Itu Kayak Apa?",
        subtitle: "Penjelasan Super Sederhana",
        aren: { position: "left", emotion: "talk", message: "Gampangnya gini — bayangin kamu ngajarin kucing..." },
        content: "AI tidak 'diprogram' dengan aturan spesifik. Sebaliknya, AI BELAJAR dari contoh — seperti anak kecil yang belajar mengenali kucing setelah melihat banyak gambar kucing.",
        visual: {
          type: "analogy-cards",
          cards: [
            { icon: "👶", text: "Anak kecil belajar\n dari contoh" },
            { icon: "➡️", text: "" },
            { icon: "🤖", text: "AI juga belajar\n dari contoh data" }
          ],
          caption: "AI belajar dari contoh, bukan dari aturan manual!"
        }
      },
      {
        type: "diagram",
        title: "Perjalanan AI dari Masa ke Masa",
        subtitle: "Timeline Sejarah AI",
        aren: { position: "top-right", emotion: "point", message: "Lihat perjalanan AI dari dulu!" },
        content: "AI bukan teknologi baru — sudah dirintis sejak tahun 1950-an. Berikut perjalanan penting dalam sejarah AI.",
        visual: {
          type: "timeline",
          events: [
            { year: "1950", event: "Alan Turing ajukan Turing Test" },
            { year: "1956", event: "Konferensi Dartmouth — AI lahir" },
            { year: "1997", event: "Deep Blue kalahkan juara catur dunia" },
            { year: "2012", event: "Era Deep Learning dimulai" },
            { year: "2023", event: "Generative AI (ChatGPT, DALL-E)" }
          ],
          caption: "AI sudah ada sejak 1950-an, booming 10 tahun terakhir!"
        }
      },
      {
        type: "funfact",
        title: "Fun Fact! Tahukah Kamu?",
        subtitle: "Fakta Mengejutkan tentang AI",
        aren: { position: "center", emotion: "surprise", message: "Wow! Serius?!" },
        visual: {
          type: "funfact-card",
          icon: "🎂",
          text: "Istilah 'Artificial Intelligence' sudah berusia 70 tahun — lebih tua dari internet, lebih tua dari komputer pribadi, bahkan lebih tua dari kebanyakan orang tua kita!"
        }
      },
      {
        type: "comparison",
        title: "Narrow AI vs General AI",
        subtitle: "Dua Jenis Kecerdasan Buatan",
        aren: { position: "bottom-right", emotion: "think", message: "Ini penting! Ada dua tipe AI..." },
        content: "Semua AI yang ada saat ini adalah Narrow AI — hanya jago di satu bidang. General AI yang bisa melakukan segala hal seperti manusia masih menjadi impian para peneliti.",
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "good", title: "✅ Narrow AI (Sekarang)", text: "AI yang jago SATU tugas: main catur, terjemahan, rekomendasi film. ChatGPT, AlphaGo adalah contohnya." },
            { type: "neutral", title: "🧠 General AI (Masa Depan)", text: "AI yang bisa mikir kayak manusia di SEMUA bidang. Masih jadi impian — belum ada yang berhasil bikin." }
          ],
          caption: "Semua AI sekarang = Narrow AI. General AI masih impian!"
        }
      },
      {
        type: "pitfalls",
        title: "Kesalahan Umum Pemula",
        subtitle: "Jangan Salah Paham tentang AI!",
        aren: { position: "left", emotion: "surprise", message: "Hati-hati! Banyak yang salah paham..." },
        content: "AI sering digambarkan secara salah di film-film. Mari luruskan kesalahpahaman yang paling umum.",
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "bad", title: "❌ MITOS", text: "AI bisa berpikir sendiri, punya kesadaran, dan bisa memberontak seperti di film Terminator." },
            { type: "good", title: "✅ FAKTA", text: "AI adalah alat matematika yang belajar pola dari data. Tidak punya kesadaran, emosi, atau keinginan sendiri." }
          ],
          caption: "AI bukan robot jahat di film. AI itu alat bantu yang powerful!"
        }
      },
      {
        type: "quiz",
        title: "Mini Quiz Evaluasi",
        subtitle: "Uji Pemahamanmu!",
        aren: { position: "bottom-right", emotion: "happy", message: "Yuk tes! Aren yakin kamu pasti bisa!" },
        questions: [
          { q: "Kapan istilah 'Artificial Intelligence' pertama kali digunakan?", opts: ["A. 1956", "B. 1969", "C. 1984", "D. 2000"], ans: "A" },
          { q: "AI yang ada sekarang termasuk tipe apa?", opts: ["A. General AI", "B. Narrow AI", "C. Super AI", "D. Magic AI"], ans: "B" }
        ]
      }
    ],
    2: [
      {
        type: "cover",
        title: "Turing Test & Kecerdasan",
        aren: { position: "center-top", emotion: "wave", message: "Halo lagi! Sekarang kita bahas Turing Test!" }
      },
      {
        type: "definition",
        title: "Apa itu Turing Test?",
        subtitle: "Tes Kecerdasan Buatan Paling Terkenal",
        aren: { position: "bottom-right", emotion: "think", message: "Turing Test itu kayak game tebak-tebakan..." },
        content: "Alan Turing (1950) mengusulkan sebuah tes: jika mesin dapat bercakap-cakap seperti manusia sehingga manusia tidak bisa membedakannya, maka mesin tersebut bisa dianggap 'cerdas'.",
        visual: {
          type: "analogy-cards",
          cards: [
            { icon: "🧑", text: "Manusia\n bertanya" },
            { icon: "➡️", text: "" },
            { icon: "🖥️", text: "Mesin\n menjawab" },
            { icon: "❓", text: "Bisakah\n dibedakan?" }
          ],
          caption: "Interrogator bertanya ke manusia & mesin — jika tidak bisa bedakan, mesin lulus!"
        }
      },
      {
        type: "eli5",
        title: "ELI5: Turing Test Itu Gimana?",
        subtitle: "Penjelasan Super Sederhana",
        aren: { position: "left", emotion: "talk", message: "Bayangin kamu chat sama dua orang..." },
        content: "Kamu chat dengan dua entitas di balik layar — satu manusia, satu AI. Kamu tidak tahu mana yang mana. Kamu boleh tanya apa saja. Jika kamu tidak bisa membedakan mana AI dan mana manusia, AI tersebut lulus Turing Test!",
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "neutral", title: "🧑 MANUSIA", text: "Punya kesadaran, emosi, pengalaman hidup nyata. Bisa menjawab pertanyaan dengan nuansa personal." },
            { type: "good", title: "🤖 AI (JIKA LULUS)", text: "Bisa menjawab dengan sangat natural — seperti manusia. Mengerti konteks, humor, dan emosi dalam percakapan." }
          ],
          caption: "AI lulus jika tidak bisa dibedakan dari manusia!"
        }
      },
      {
        type: "diagram",
        title: "Proses Turing Test",
        subtitle: "Flow Percakapan",
        aren: { position: "top-right", emotion: "point", message: "Lihat alurnya!" },
        content: "Turing Test tidak menguji apakah AI 'benar-benar' berpikir — hanya apakah AI bisa meniru percakapan manusia dengan cukup baik.",
        visual: {
          type: "process-flow",
          steps: [
            { icon: "❓", label: "Interrogator\n bertanya" },
            { icon: "📤", label: "Pertanyaan\n dikirim" },
            { icon: "🧠", label: "AI memproses\n jawaban" },
            { icon: "📥", label: "Jawaban\n diterima" },
            { icon: "🤔", label: "Bisa bedakan\n atau tidak?" }
          ],
          caption: "Alur komunikasi dalam Turing Test"
        }
      },
      {
        type: "funfact",
        title: "Fun Fact! Tahukah Kamu?",
        subtitle: "Fakta Mengejutkan",
        aren: { position: "center", emotion: "surprise", message: "Wow! Keren banget!" },
        visual: {
          type: "funfact-card",
          icon: "🏆",
          text: "Tahun 2014, sebuah chatbot bernama 'Eugene Goostman' diklaim sebagai yang pertama lulus Turing Test — tapi masih kontroversial. Banyak peneliti yang tidak setuju dengan klaim tersebut!"
        }
      },
      {
        type: "comparison",
        title: "Kelebihan & Kekurangan Turing Test",
        subtitle: "Evaluasi Kritis",
        aren: { position: "bottom-right", emotion: "think", message: "Turing Test nggak sempurna lho..." },
        content: "Turing Test sangat terkenal, tapi juga banyak dikritik. Apakah meniru percakapan manusia benar-benar tanda kecerdasan?",
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "good", title: "👍 KELEBIHAN", text: "Sederhana, mudah dipahami, tidak perlu definisi 'kecerdasan' yang rumit. Bisa diuji oleh siapa saja." },
            { type: "bad", title: "👎 KEKURANGAN", text: "Hanya menguji kemampuan bahasa — bukan penalaran, kreativitas, atau pemahaman sejati. AI bisa 'menipu' tanpa benar-benar cerdas." }
          ],
          caption: "Turing Test bukan ukuran sempurna kecerdasan AI!"
        }
      },
      {
        type: "pitfalls",
        title: "Jangan Tertipu!",
        subtitle: "AI yang 'Lulus' Belum Tentu Cerdas",
        aren: { position: "left", emotion: "surprise", message: "Hati-hati! Jangan mudah tertipu!" },
        content: "Beberapa AI bisa 'lulus' Turing Test bukan karena benar-benar cerdas, tapi karena mereka diprogram khusus untuk mengelabui percakapan — seperti menghindari pertanyaan sulit atau memberi jawaban lucu.",
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "bad", title: "❌ BUKAN KECERDASAN", text: "AI yang cuma menghindari pertanyaan, memberi jawaban ngawur, atau berpura-pura tidak mengerti — ini trik, bukan kecerdasan." },
            { type: "good", title: "✅ KECERDASAN SEJATI", text: "AI yang benar-benar memahami, bisa menalar, dan memberikan jawaban yang relevan dan mendalam terhadap pertanyaan kompleks." }
          ],
          caption: "Jangan tertipu AI yang cuma jago ngeles!"
        }
      },
      {
        type: "quiz",
        title: "Mini Quiz Evaluasi",
        subtitle: "Uji Pemahamanmu!",
        aren: { position: "bottom-right", emotion: "happy", message: "Yuk tes! Aren percaya kamu!" },
        questions: [
          { q: "Siapa yang mengusulkan Turing Test?", opts: ["A. Alan Turing", "B. John McCarthy", "C. Elon Musk", "D. Bill Gates"], ans: "A" },
          { q: "Apa yang diuji dalam Turing Test?", opts: ["A. Kecepatan komputasi", "B. Kemampuan percakapan", "C. Kemampuan matematika", "D. Kemampuan olahraga"], ans: "B" }
        ]
      }
    ],
    3: [
      {
        type: "cover",
        title: "Symbolic AI vs Machine Learning",
        aren: { position: "center-top", emotion: "wave", message: "Dua pendekatan AI yang berbeda!" }
      },
      {
        type: "definition",
        title: "Symbolic AI: AI Berbasis Aturan",
        subtitle: "Pendekatan Klasik",
        aren: { position: "bottom-right", emotion: "think", message: "Symbolic AI itu kayak buku aturan..." },
        content: "Symbolic AI (GOFAI) bekerja dengan aturan eksplisit: IF-THEN. Manusia menulis semua aturan. Cocok untuk masalah yang aturannya jelas — seperti sistem pakar medis atau aturan catur.",
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "neutral", title: "📖 Symbolic AI", text: "Menggunakan aturan eksplisit yang ditulis manusia. IF gejala A THEN diagnosa B. Transparan dan bisa dijelaskan." },
            { type: "good", title: "🧠 Machine Learning", text: "Belajar dari data. Tidak perlu aturan manual. Menemukan pola sendiri. Butuh banyak data tapi lebih fleksibel." }
          ],
          caption: "Dua pendekatan yang sangat berbeda!"
        }
      },
      {
        type: "eli5",
        title: "ELI5: Bedanya Symbolic vs ML",
        subtitle: "Penjelasan Super Sederhana",
        aren: { position: "left", emotion: "talk", message: "Bayangin kamu mau ngajarin komputer..." },
        content: "Symbolic AI: kamu tulis semua aturan main catur satu per satu. ML: kamu kasih 10.000 rekaman pertandingan catur, komputer belajar sendiri strateginya.",
        visual: {
          type: "analogy-cards",
          cards: [
            { icon: "📝", text: "Symbolic:\nTulis aturan\nsatu per satu" },
            { icon: "📊", text: "ML:\nKasih data,\nkomputer belajar" }
          ],
          caption: "Symbolic = manual. ML = otomatis dari data!"
        }
      },
      {
        type: "diagram",
        title: "Perbandingan Pendekatan",
        subtitle: "Kapan Pakai yang Mana?",
        aren: { position: "top-right", emotion: "point", message: "Lihat perbandingannya!" },
        content: "Tidak ada pendekatan yang selalu lebih baik. Pilihan tergantung pada masalah yang dihadapi.",
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "good", title: "✅ Symbolic AI cocok untuk:", text: "Aturan jelas (pajak, hukum), butuh penjelasan, data terbatas, domain knowledge dari pakar tersedia." },
            { type: "good", title: "✅ ML cocok untuk:", text: "Data melimpah, pola kompleks (gambar, suara), aturan sulit didefinisikan, perlu adaptasi dari data baru." }
          ],
          caption: "Pilih pendekatan sesuai masalah!"
        }
      },
      {
        type: "funfact",
        title: "Fun Fact! Tahukah Kamu?",
        subtitle: "Sejarah Menarik",
        aren: { position: "center", emotion: "surprise", message: "Menarik banget!" },
        visual: {
          type: "funfact-card",
          icon: "⚔️",
          text: "Dulu Symbolic AI dan ML sempat 'berperang' — mana yang lebih baik? Sekarang kita tahu: keduanya bisa digabungkan! Ini disebut 'Neuro-Symbolic AI' — kombinasi terbaik dari dua dunia."
        }
      },
      {
        type: "comparison",
        title: "Contoh Nyata",
        subtitle: "Aplikasi di Dunia Nyata",
        aren: { position: "bottom-right", emotion: "think", message: "Contohnya apa aja ya?" },
        content: "Kedua pendekatan ini digunakan di berbagai aplikasi yang mungkin kamu gunakan sehari-hari.",
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "neutral", title: "🔧 Symbolic AI", text: "Sistem pakar diagnosa penyakit (MYCIN), aturan pajak, sistem rekomendasi berbasis aturan, chess engine klasik." },
            { type: "good", title: "🤖 Machine Learning", text: "Rekomendasi Netflix, face recognition, terjemahan Google, ChatGPT, self-driving car, deteksi spam." }
          ],
          caption: "Keduanya ada di sekitar kita!"
        }
      },
      {
        type: "pitfalls",
        title: "Jangan Salah Pilih!",
        subtitle: "Kesalahan Umum",
        aren: { position: "left", emotion: "surprise", message: "Jangan asal pilih metodenya!" },
        content: "Kesalahan terbesar adalah memaksakan satu pendekatan untuk semua masalah. Pahami dulu masalahnya, baru pilih alatnya.",
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "bad", title: "❌ JANGAN", text: "Pakai deep learning untuk aturan sederhana (100 data, 2 aturan). Buang-buang resource. Overengineered." },
            { type: "good", title: "✅ LAKUKAN", text: "Analisis masalah dulu. Kalau aturannya jelas → symbolic. Kalau datanya banyak dan polanya kompleks → ML." }
          ],
          caption: "Tool yang tepat untuk job yang tepat!"
        }
      },
      {
        type: "quiz",
        title: "Mini Quiz Evaluasi",
        subtitle: "Uji Pemahamanmu!",
        aren: { position: "bottom-right", emotion: "happy", message: "Yuk tes! Aren bantu kamu!" },
        questions: [
          { q: "Symbolic AI menggunakan...", opts: ["A. Data training", "B. Aturan eksplisit", "C. Neural network", "D. GPU"], ans: "B" },
          { q: "Machine Learning belajar dari...", opts: ["A. Aturan manual", "B. Data dan contoh", "C. Perintah suara", "D. Kode program"], ans: "B" }
        ]
      }
    ],
    4: [
      {
        type: "cover",
        title: "Agen Cerdas & Lingkungan",
        aren: { position: "center-top", emotion: "wave", message: "Sekarang kita bahas agen cerdas!" }
      },
      {
        type: "definition",
        title: "Apa itu Agen Cerdas?",
        subtitle: "Definisi Intelligent Agent",
        aren: { position: "bottom-right", emotion: "think", message: "Agen cerdas itu kayak robot kecil..." },
        content: "Agen cerdas adalah entitas yang merasakan lingkungannya melalui sensor dan bertindak melalui aktuator. Bisa berupa software (chatbot) atau hardware (robot).",
        visual: {
          type: "process-flow",
          steps: [
            { icon: "👁️", label: "Sensor\n(Input)" },
            { icon: "🧠", label: "Proses\n(Pikir)" },
            { icon: "💪", label: "Aktuator\n(Output)" },
            { icon: "🔄", label: "Feedback\n(Belajar)" }
          ],
          caption: "Siklus agent: Sense → Think → Act → Learn"
        }
      },
      {
        type: "eli5",
        title: "ELI5: Agen Cerdas Itu Kayak Apa?",
        subtitle: "Penjelasan Super Sederhana",
        aren: { position: "left", emotion: "talk", message: "Bayangin vacuum cleaner otomatis..." },
        content: "Robot vacuum cleaner adalah contoh agen cerdas. Sensor: mendeteksi debu dan rintangan. Proses: memutuskan ke mana harus bergerak. Aktuator: motor dan roda. Dia 'cerdas' karena bisa beradaptasi dengan lingkungan.",
        visual: {
          type: "analogy-cards",
          cards: [
            { icon: "🧹", text: "Sensor:\nDeteksi debu\n& rintangan" },
            { icon: "🧠", text: "Proses:\nPutuskan\nrute" },
            { icon: "🏃", text: "Aktuator:\nMotor\n& roda" }
          ],
          caption: "Robot vacuum = contoh agen cerdas!"
        }
      },
      {
        type: "diagram",
        title: "Tipe-Tipe Agen Cerdas",
        subtitle: "Dari Simple Sampai Learning Agent",
        aren: { position: "top-right", emotion: "point", message: "Ada banyak tipe agen!" },
        content: "Agen cerdas memiliki beberapa tingkatan — dari yang paling sederhana hingga yang bisa belajar sendiri.",
        visual: {
          type: "timeline",
          events: [
            { year: "Level 1", event: "Simple Reflex: hanya reaksi langsung" },
            { year: "Level 2", event: "Model-Based: menyimpan 'ingatan'" },
            { year: "Level 3", event: "Goal-Based: punya tujuan spesifik" },
            { year: "Level 4", event: "Utility-Based: optimasi preferensi" },
            { year: "Level 5", event: "Learning Agent: bisa belajar mandiri" }
          ],
          caption: "Semakin tinggi level, semakin cerdas agennya!"
        }
      },
      {
        type: "funfact",
        title: "Fun Fact! Tahukah Kamu?",
        subtitle: "Agen AI di Sekitar Kita",
        aren: { position: "center", emotion: "surprise", message: "Kita dikelilingi agen AI!" },
        visual: {
          type: "funfact-card",
          icon: "🌍",
          text: "Setiap hari kamu berinteraksi dengan puluhan agen AI: Google Search, rekomendasi YouTube, filter spam email, asisten virtual, navigasi GPS — semuanya adalah agen cerdas!"
        }
      },
      {
        type: "comparison",
        title: "Software Agent vs Hardware Agent",
        subtitle: "Dua Wujud Agen Cerdas",
        aren: { position: "bottom-right", emotion: "think", message: "Agen bisa software atau hardware lho!" },
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "good", title: "💻 Software Agent", text: "Chatbot, search engine, recommendation system, filter spam. Hidup di dunia digital — input dan output-nya data." },
            { type: "neutral", title: "🔧 Hardware Agent", text: "Robot, self-driving car, drone, smart home devices. Hidup di dunia fisik — input dari sensor, output ke motor." }
          ],
          caption: "Dua wujud agen cerdas yang berbeda!"
        }
      },
      {
        type: "pitfalls",
        title: "Kesalahan Umum",
        subtitle: "Jangan Salah Konsep!",
        aren: { position: "left", emotion: "surprise", message: "Agen nggak selalu berbentuk robot!" },
        content: "Banyak yang mengira agen AI harus berbentuk robot fisik. Padahal, sebagian besar AI adalah software — tidak punya tubuh fisik sama sekali.",
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "bad", title: "❌ SALAH", text: "Agen AI = robot humanoid seperti di film. Harus punya tangan, kaki, dan bisa bergerak secara fisik." },
            { type: "good", title: "✅ BENAR", text: "Agen AI bisa murni software — Google Search, Siri, ChatGPT adalah agen AI tanpa tubuh fisik." }
          ],
          caption: "AI nggak harus berbentuk robot!"
        }
      },
      {
        type: "quiz",
        title: "Mini Quiz Evaluasi",
        subtitle: "Uji Pemahamanmu!",
        aren: { position: "bottom-right", emotion: "happy", message: "Ayo tes! Aren semangatin kamu!" },
        questions: [
          { q: "Komponen agent: sense lalu...", opts: ["A. Sleep", "B. Think", "C. Eat", "D. Sing"], ans: "B" },
          { q: "Contoh software agent:", opts: ["A. Robot vacuum", "B. Self-driving car", "C. Google Search", "D. Drone"], ans: "C" }
        ]
      }
    ],
    5: [
      {
        type: "cover",
        title: "Narrow vs Broad AI",
        aren: { position: "center-top", emotion: "wave", message: "Narrow, General, Super — apa bedanya?" }
      },
      {
        type: "definition",
        title: "Tiga Tingkatan AI",
        subtitle: "ANI, AGI, ASI",
        aren: { position: "bottom-right", emotion: "think", message: "AI punya level-levelan lho..." },
        content: "AI diklasifikasikan ke dalam 3 level: Narrow (spesifik), General (setara manusia), dan Super (melampaui manusia). Saat ini kita baru mencapai level pertama.",
        visual: {
          type: "process-flow",
          steps: [
            { icon: "🐜", label: "Narrow AI\n(ANI)" },
            { icon: "🧑", label: "General AI\n(AGI)" },
            { icon: "🚀", label: "Super AI\n(ASI)" }
          ],
          caption: "Kita masih di level 1 — Narrow AI!"
        }
      },
      {
        type: "eli5",
        title: "ELI5: Bedanya Narrow, General, Super",
        subtitle: "Penjelasan Super Sederhana",
        aren: { position: "left", emotion: "talk", message: "Bayangin kayak game level..." },
        content: "Narrow AI: jago SATU hal (catur, Go, rekomendasi). General AI: bisa SEMUA hal kayak manusia. Super AI: lebih pinter dari seluruh manusia digabung. Kita baru di level 1!",
        visual: {
          type: "analogy-cards",
          cards: [
            { icon: "🐜", text: "Narrow:\nJago 1 hal" },
            { icon: "➡️", text: "" },
            { icon: "🧑", text: "General:\nKayak manusia" },
            { icon: "➡️", text: "" },
            { icon: "🚀", text: "Super:\nMelampaui\nmanusia" }
          ],
          caption: "Narrow → General → Super = perjalanan panjang!"
        }
      },
      {
        type: "diagram",
        title: "Contoh Narrow AI di Kehidupan",
        subtitle: "AI yang Kamu Pakai Sehari-hari",
        aren: { position: "top-right", emotion: "point", message: "Kamu pakai Narrow AI setiap hari!" },
        content: "Semua AI yang ada saat ini adalah Narrow AI. Mereka sangat jago di bidangnya masing-masing.",
        visual: {
          type: "icon-grid",
          icons: ["🎵", "🎬", "📧", "🗺️", "📸", "🛒"],
          labels: ["Spotify", "Netflix", "Spam Filter", "Google Maps", "Face ID", "Shopee"],
          caption: "Semua ini adalah Narrow AI — jago di bidangnya!"
        }
      },
      {
        type: "funfact",
        title: "Fun Fact! Tahukah Kamu?",
        subtitle: "Fakta tentang AGI",
        aren: { position: "center", emotion: "surprise", message: "AGI masih misteri!" },
        visual: {
          type: "funfact-card",
          icon: "❓",
          text: "Para ahli tidak sepakat kapan AGI akan terwujud. Ada yang optimis (2030-an), ada yang pesimis (100+ tahun lagi). Bahkan ada yang meragukan AGI mungkin tidak akan pernah tercapai!"
        }
      },
      {
        type: "comparison",
        title: "Mana yang Sudah Ada dan Belum?",
        subtitle: "Status Terkini",
        aren: { position: "bottom-right", emotion: "think", message: "Mana yang udah jadi kenyataan?" },
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "good", title: "✅ SUDAH ADA", text: "Narrow AI: ChatGPT, AlphaGo, Siri, rekomendasi Netflix, filter spam, face recognition. Semua AI yang ada sekarang = Narrow." },
            { type: "neutral", title: "❓ BELUM ADA", text: "General AI: belum tercapai. Masih menjadi tujuan riset jangka panjang. Butuh terobosan besar dalam AI research." },
            { type: "bad", title: "🚫 FANTASI", text: "Super AI: murni spekulatif. Hanya ada di film dan buku fiksi ilmiah. Mungkin tidak akan pernah ada — atau justru sebaliknya." }
          ],
          caption: "Kenyataan vs Fiksi — mana yang nyata?"
        }
      },
      {
        type: "pitfalls",
        title: "Jangan Salah Kaprah!",
        subtitle: "Media Sering Melebih-lebihkan AI",
        aren: { position: "left", emotion: "surprise", message: "Hati-hati sama berita bombastis!" },
        content: "Media sering memberi judul bombastis tentang AI — 'AI akan mengambil alih dunia'. Kenyataannya, semua AI saat ini masih sangat terbatas pada tugas spesifik.",
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "bad", title: "📰 MEDIA", text: "'AI bisa berpikir sendiri!' 'AI akan menggantikan manusia!' 'AI sudah punya kesadaran!' — Semua ini berlebihan." },
            { type: "good", title: "🔬 KENYATAAN", text: "AI saat ini hanya alat matematika canggih. Tidak punya keinginan, emosi, atau kesadaran. Tidak bisa 'mengambil alih' apapun." }
          ],
          caption: "Jangan percaya semua berita tentang AI!"
        }
      },
      {
        type: "quiz",
        title: "Mini Quiz Evaluasi",
        subtitle: "Uji Pemahamanmu!",
        aren: { position: "bottom-right", emotion: "happy", message: "Quiz terakhir level ini! Semangat!" },
        questions: [
          { q: "AI yang ada sekarang termasuk...", opts: ["A. General AI", "B. Narrow AI", "C. Super AI", "D. Magic AI"], ans: "B" },
          { q: "AGI kepanjangan dari...", opts: ["A. Awesome General Intelligence", "B. Artificial General Intelligence", "C. Automated Global Interface", "D. Advanced Graphic Integration"], ans: "B" }
        ]
      }
    ],
    6: [
      {
        type: "cover",
        title: "Masa Depan Artificial Intelligence",
        aren: { position: "center-top", emotion: "wave", message: "Yuk kita lihat masa depan AI!" }
      },
      {
        type: "definition",
        title: "Ke Mana Arah AI Selanjutnya?",
        subtitle: "Tren dan Prediksi",
        aren: { position: "bottom-right", emotion: "think", message: "Masa depan AI itu menarik..." },
        content: "AI berkembang dengan sangat cepat. Beberapa tren yang akan membentuk masa depan: AI multimodal, AI yang lebih kecil dan efisien, AI untuk sains, dan AI yang lebih bertanggung jawab.",
        visual: {
          type: "icon-grid",
          icons: ["🎨", "🔬", "🏥", "🌍", "🤝", "⚡"],
          labels: ["AI Kreatif", "AI untuk Sains", "AI Medis", "AI untuk Iklim", "AI Kolaboratif", "AI Efisien"],
          caption: "Bidang-bidang yang akan ditransformasi AI!"
        }
      },
      {
        type: "eli5",
        title: "ELI5: AI Masa Depan Kayak Apa?",
        subtitle: "Penjelasan Super Sederhana",
        aren: { position: "left", emotion: "talk", message: "Bayangin asisten super pintar..." },
        content: "Di masa depan, AI akan seperti asisten super pintar yang membantu di semua bidang: dokter dibantu AI diagnosis penyakit, ilmuwan dibantu AI menemukan obat baru, petani dibantu AI mengoptimalkan panen.",
        visual: {
          type: "analogy-cards",
          cards: [
            { icon: "👨‍⚕️", text: "Dokter + AI\n= Diagnosis\nlebih akurat" },
            { icon: "👨‍🔬", text: "Ilmuwan + AI\n= Penemuan\nlebih cepat" },
            { icon: "👨‍🌾", text: "Petani + AI\n= Panen\nlebih optimal" }
          ],
          caption: "AI sebagai asisten, bukan pengganti manusia!"
        }
      },
      {
        type: "diagram",
        title: "Pekerjaan yang Akan Berubah",
        subtitle: "Bukan Hilang, Tapi Berubah",
        aren: { position: "top-right", emotion: "point", message: "Jangan takut! Pekerjaan berubah, bukan hilang!" },
        content: "AI akan mengotomatisasi tugas-tugas repetitif — tapi justru menciptakan pekerjaan baru yang lebih kreatif dan bermakna.",
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "neutral", title: "🔄 BERUBAH", text: "Akuntan → lebih fokus ke analisis strategis. Customer service → lebih fokus ke kasus kompleks. Translator → lebih fokus ke nuansa budaya." },
            { type: "good", title: "✨ BARU", text: "Prompt Engineer, AI Ethicist, AI Auditor, AI Trainer, MLOps Engineer — pekerjaan yang tidak ada 10 tahun lalu!" }
          ],
          caption: "Pekerjaan berevolusi, bukan punah!"
        }
      },
      {
        type: "funfact",
        title: "Fun Fact! Tahukah Kamu?",
        subtitle: "Prediksi Para Ahli",
        aren: { position: "center", emotion: "surprise", message: "Prediksi masa depan nih!" },
        visual: {
          type: "funfact-card",
          icon: "🔮",
          text: "Menurut survey 2.778 peneliti AI: 50% responden memperkirakan AI akan bisa mengerjakan SEMUA tugas manusia di tahun 2060. Tapi 50% lainnya bilang lebih lama — atau tidak akan pernah!"
        }
      },
      {
        type: "comparison",
        title: "Peluang dan Tantangan",
        subtitle: "Dua Sisi AI",
        aren: { position: "bottom-right", emotion: "think", message: "AI itu kayak koin — ada dua sisi..." },
        visual: {
          type: "comparison-cards",
          cards: [
            { type: "good", title: "🌅 PELUANG", text: "Obat baru lebih cepat ditemukan, pendidikan personalisasi, energi lebih efisien, transportasi lebih aman, akses informasi merata." },
            { type: "bad", title: "⚠️ TANTANGAN", text: "Ketimpangan akses, bias algoritma, privasi data, disinformasi, senjata otonom, ketergantungan berlebihan pada AI." }
          ],
          caption: "Masa depan AI tergantung bagaimana kita mengelolanya!"
        }
      },
      {
        type: "pitfalls",
        title: "Yang Bisa Kamu Lakukan",
        subtitle: "Persiapan Menghadapi Era AI",
        aren: { position: "left", emotion: "happy", message: "Kamu bisa siapkan diri!" },
        content: "Daripada takut dengan AI, lebih baik siapkan diri. Pelajari keterampilan yang tidak mudah diotomatisasi: kreativitas, pemikiran kritis, empati, dan kolaborasi.",
        visual: {
          type: "icon-grid",
          icons: ["📚", "💡", "🤝", "❤️"],
          labels: ["Belajar Terus", "Berpikir Kritis", "Kolaborasi", "Empati"],
          caption: "Keterampilan manusia yang tidak tergantikan AI!"
        }
      },
      {
        type: "quiz",
        title: "Mini Quiz Evaluasi",
        subtitle: "Uji Pemahaman Akhir Modul!",
        aren: { position: "bottom-right", emotion: "happy", message: "Quiz terakhir modul ini! Kamu hebat!" },
        questions: [
          { q: "Pekerjaan akan... karena AI", opts: ["A. Hilang semua", "B. Berubah dan berevolusi", "C. Tetap sama", "D. Tidak terpengaruh"], ans: "B" },
          { q: "Keterampilan yang sulit digantikan AI:", opts: ["A. Mengetik cepat", "B. Kreativitas dan empati", "C. Menghitung", "D. Mengingat fakta"], ans: "B" }
        ]
      }
    ]
  },
  
  // ==================== MODUL 2: MACHINE LEARNING ====================
  "module_02": {
    1: [
      { type: "cover", title: "Supervised Learning", aren: { position: "center-top", emotion: "wave", message: "Yuk belajar Machine Learning!" } },
      { type: "definition", title: "Apa itu Supervised Learning?", aren: { position: "bottom-right", emotion: "think", message: "Supervised learning = belajar dengan contoh..." }, content: "Supervised learning adalah metode ML di mana model dilatih dengan data yang sudah punya label jawaban benar. Ibaratnya: guru memberikan soal + kunci jawaban, murid belajar dari situ.", visual: { type: "analogy-cards", cards: [{ icon: "📚", text: "Data + Label" }, { icon: "➡️", text: "" }, { icon: "🧠", text: "Model Belajar" }, { icon: "➡️", text: "" }, { icon: "✅", text: "Prediksi" }], caption: "Model belajar dari contoh yang sudah ada jawabannya!" } },
      { type: "eli5", title: "ELI5: Supervised Learning", aren: { position: "left", emotion: "talk", message: "Kayak belajar pakai flashcard..." }, content: "Kamu punya kartu bergambar kucing dan anjing. Setiap kartu ada labelnya. Kamu belajar dari kartu itu. Nanti pas lihat gambar baru, kamu bisa nebak: ini kucing atau anjing.", visual: { type: "analogy-cards", cards: [{ icon: "🐱", text: "Gambar\nKucing" }, { icon: "🏷️", text: "Label:\n'Kucing'" }, { icon: "🧠", text: "Belajar\nPolanya" }, { icon: "❓", text: "Gambar\nBaru" }, { icon: "🐱", text: "Prediksi:\n'Kucing'" }], caption: "Belajar dari contoh berlabel!" } },
      { type: "diagram", title: "Contoh Supervised Learning", aren: { position: "top-right", emotion: "point", message: "Banyak contoh di sekitar kita!" }, content: "Supervised learning adalah metode ML yang paling banyak digunakan. Hampir semua aplikasi AI yang kamu kenal menggunakan ini.", visual: { type: "icon-grid", icons: ["📧", "🏠", "🩺", "💰", "🎬", "📸"], labels: ["Deteksi Spam", "Prediksi Harga", "Diagnosa Medis", "Credit Scoring", "Rekomendasi", "Face Recognition"], caption: "Aplikasi supervised learning di kehidupan sehari-hari!" } },
      { type: "funfact", title: "Fun Fact!", aren: { position: "center", emotion: "surprise", message: "Menarik banget!" }, visual: { type: "funfact-card", icon: "📊", text: "Supervised learning adalah jenis ML yang paling banyak digunakan di industri — sekitar 70% dari semua aplikasi ML di perusahaan menggunakan supervised learning!" } },
      { type: "comparison", title: "Klasifikasi vs Regresi", aren: { position: "bottom-right", emotion: "think", message: "Dua tipe supervised learning..." }, visual: { type: "comparison-cards", cards: [{ type: "good", title: "🏷️ Klasifikasi", text: "Output = kategori. Contoh: spam/tidak, kucing/anjing/mobil. Model memprediksi kelas." }, { type: "neutral", title: "📈 Regresi", text: "Output = angka kontinu. Contoh: harga rumah, suhu, tinggi badan. Model memprediksi nilai." }], caption: "Keduanya supervised learning dengan output berbeda!" } },
      { type: "pitfalls", title: "Kesalahan Umum", aren: { position: "left", emotion: "surprise", message: "Hati-hati! Jangan sampe salah..." }, content: "Supervised learning butuh data berlabel. Masalahnya: labeling data itu mahal dan butuh waktu. Itu sebabnya muncul semi-supervised dan unsupervised learning.", visual: { type: "comparison-cards", cards: [{ type: "bad", title: "❌ MASALAH", text: "Butuh ribuan data berlabel. Untuk 1000 gambar, butuh manusia melabeli satu per satu. Mahal dan lama." }, { type: "good", title: "✅ SOLUSI", text: "Gunakan semi-supervised (sedikit label) atau transfer learning (pakai model yang sudah dilatih di data besar)." }], caption: "Labeling data = tantangan terbesar supervised learning!" } },
      { type: "quiz", title: "Mini Quiz", aren: { position: "bottom-right", emotion: "happy", message: "Yuk tes pemahaman!" }, questions: [{ q: "Supervised learning butuh...", opts: ["Data berlabel", "Data tanpa label", "Tidak butuh data", "Hanya butuh GPU"], ans: "A" }, { q: "Prediksi harga rumah = contoh...", opts: ["Klasifikasi", "Regresi", "Clustering", "Reinforcement"], ans: "B" }] }
    ],
    2: [
      { type: "cover", title: "Unsupervised Learning", aren: { position: "center-top", emotion: "wave", message: "Sekarang kita bahas unsupervised learning!" } },
      { type: "definition", title: "Apa itu Unsupervised Learning?", aren: { position: "bottom-right", emotion: "think", message: "Unsupervised = tanpa label..." }, content: "Unsupervised learning adalah metode ML di mana model belajar dari data TANPA label. Model mencari sendiri pola, struktur, atau pengelompokan yang tersembunyi dalam data.", visual: { type: "analogy-cards", cards: [{ icon: "📊", text: "Data tanpa\nlabel" }, { icon: "➡️", text: "" }, { icon: "🧠", text: "Model cari\npola sendiri" }, { icon: "➡️", text: "" }, { icon: "🔍", text: "Temukan\nstruktur" }], caption: "Model menemukan pola tanpa diberi tahu jawabannya!" } },
      { type: "eli5", title: "ELI5: Unsupervised Learning", aren: { position: "left", emotion: "talk", message: "Kayak mengelompokkan mainan..." }, content: "Bayangkan kamu punya sekotak mainan campur: mobil, boneka, puzzle. Kamu nggak tahu namanya, tapi kamu bisa mengelompokkannya berdasarkan kemiripan: yang beroda, yang lembut, yang dari kayu.", visual: { type: "analogy-cards", cards: [{ icon: "🧸", text: "Campuran\nmainan" }, { icon: "🧠", text: "Cari\nkemiripan" }, { icon: "🗂️", text: "Kelompok 1:\nBeroda" }, { icon: "🗂️", text: "Kelompok 2:\nLembut" }], caption: "Mengelompokkan tanpa tahu nama kelompoknya!" } },
      { type: "diagram", title: "Clustering — Teknik Paling Populer", aren: { position: "top-right", emotion: "point", message: "Ini dia clustering!" }, content: "Clustering adalah teknik unsupervised learning yang paling umum. Data dikelompokkan berdasarkan kemiripan — data dalam satu cluster mirip, data antar cluster berbeda.", visual: { type: "icon-grid", icons: ["🛒", "👥", "📰", "🔍", "🧬", "🌐"], labels: ["Segmentasi\nPelanggan", "Customer\nPersona", "Topic\nModeling", "Anomaly\nDetection", "Gene\nClustering", "Community\nDetection"], caption: "Berbagai aplikasi clustering di dunia nyata!" } },
      { type: "funfact", title: "Fun Fact!", aren: { position: "center", emotion: "surprise", message: "Menarik!" }, visual: { type: "funfact-card", icon: "🎯", text: "Netflix menghemat $1 miliar per tahun menggunakan unsupervised learning untuk rekomendasi personal — mengelompokkan penonton dengan selera mirip tanpa harus menanyakan preferensi mereka!" } },
      { type: "comparison", title: "K-Means vs DBSCAN", aren: { position: "bottom-right", emotion: "think", message: "Dua algoritma clustering populer..." }, visual: { type: "comparison-cards", cards: [{ type: "good", title: "🔵 K-Means", text: "Cepat dan sederhana. Perlu tentukan jumlah cluster (K) di awal. Cocok untuk cluster berbentuk bola." }, { type: "neutral", title: "🟢 DBSCAN", text: "Tidak perlu tentukan jumlah cluster. Bisa deteksi cluster bentuk apapun. Otomatis deteksi outlier." }], caption: "Pilih algoritma sesuai bentuk data!" } },
      { type: "pitfalls", title: "Kesalahan Umum", aren: { position: "left", emotion: "surprise", message: "Jangan asal clustering!" }, content: "Clustering SELALU menghasilkan kelompok — meskipun sebenarnya tidak ada struktur. Jangan lupa validasi hasil clustering.", visual: { type: "comparison-cards", cards: [{ type: "bad", title: "❌ JANGAN", text: "Langsung percaya hasil clustering tanpa validasi. Clustering akan selalu menghasilkan kelompok — bahkan dari data random." }, { type: "good", title: "✅ LAKUKAN", text: "Validasi dengan silhouette score, elbow method, atau domain expert. Pastikan cluster yang ditemukan bermakna." }], caption: "Validasi hasil clustering itu wajib!" } },
      { type: "quiz", title: "Mini Quiz", aren: { position: "bottom-right", emotion: "happy", message: "Yuk tes!" }, questions: [{ q: "Unsupervised learning butuh data...", opts: ["Berlabel", "Tanpa label", "Berupa gambar", "Berupa teks"], ans: "B" }, { q: "Teknik clustering yang paling populer:", opts: ["Regresi", "K-Means", "Decision Tree", "SVM"], ans: "B" }] }
    ],
    // Level 3-6 Modul 2 akan mengikuti pola yang sama...
    3: [
      { type: "cover", title: "Reinforcement Learning", aren: { position: "center-top", emotion: "wave", message: "Sekarang belajar reinforcement learning!" } },
      { type: "definition", title: "Apa itu Reinforcement Learning?", aren: { position: "bottom-right", emotion: "think", message: "RL = belajar dari reward & punishment..." }, content: "Reinforcement learning adalah metode ML di mana agent belajar melalui interaksi dengan environment — menerima reward untuk aksi yang benar dan hukuman untuk aksi yang salah.", visual: { type: "process-flow", steps: [{ icon: "🤖", label: "Agent" }, { icon: "🎮", label: "Aksi" }, { icon: "🌍", label: "Environment" }, { icon: "🎁", label: "Reward" }], caption: "Agent belajar dari trial and error!" } },
      { type: "eli5", title: "ELI5: RL Itu Gimana?", aren: { position: "left", emotion: "talk", message: "Kayak ngajarin anjing..." }, content: "Kamu ngajarin anjing duduk. Kalau dia duduk → dapat treat (reward). Kalau tidak → tidak dapat apa-apa. Anjing belajar: 'Oh, kalau duduk aku dapat hadiah!' Ini persis cara kerja reinforcement learning.", visual: { type: "analogy-cards", cards: [{ icon: "🐕", text: "Anjing\n(Agent)" }, { icon: "🦴", text: "Duduk =\nDapat treat" }, { icon: "❌", text: "Lari =\nTidak dapat" }, { icon: "🧠", text: "Belajar:\nDuduk = baik" }], caption: "Belajar dari reward seperti melatih hewan!" } },
      { type: "funfact", title: "Fun Fact!", aren: { position: "center", emotion: "surprise", message: "RL itu keren!" }, visual: { type: "funfact-card", icon: "🎮", text: "AlphaGo — AI yang mengalahkan juara dunia Go — dilatih dengan reinforcement learning. Dia bermain jutaan game melawan dirinya sendiri untuk belajar strategi terbaik!" } },
      { type: "quiz", title: "Mini Quiz", aren: { position: "bottom-right", emotion: "happy", message: "Yuk tes!" }, questions: [{ q: "RL belajar dari...", opts: ["Label", "Reward", "Aturan", "GPU"], ans: "B" }, { q: "AlphaGo menggunakan...", opts: ["Supervised", "Unsupervised", "Reinforcement", "Rule-based"], ans: "C" }] }
    ],
    4: [
      { type: "cover", title: "Regression vs Classification", aren: { position: "center-top", emotion: "wave", message: "Dua output berbeda!" } },
      { type: "definition", title: "Regression: Prediksi Angka", aren: { position: "bottom-right", emotion: "think", message: "Regresi = output angka..." }, content: "Regresi digunakan ketika outputnya berupa nilai kontinu — harga, suhu, tinggi, berat. Model memprediksi angka, bukan kategori.", visual: { type: "icon-grid", icons: ["🏠", "🌡️", "📏", "💰"], labels: ["Harga Rumah", "Suhu Udara", "Tinggi Badan", "Harga Saham"], caption: "Output regresi selalu berupa angka kontinu!" } },
      { type: "eli5", title: "ELI5: Regression", aren: { position: "left", emotion: "talk", message: "Kayak nebak angka..." }, content: "Kamu lihat 100 rumah yang sudah dijual beserta harganya. Dari situ, kamu bisa nebak: 'Rumah seluas ini, di lokasi ini, kira-kira harganya segini.'", visual: { type: "analogy-cards", cards: [{ icon: "🏠", text: "Rumah\n(luas, lokasi)" }, { icon: "➡️", text: "" }, { icon: "🧠", text: "Model\nRegresi" }, { icon: "➡️", text: "" }, { icon: "💰", text: "Prediksi:\nRp 500 Juta" }], caption: "Model regresi memprediksi nilai kontinu!" } },
      { type: "funfact", title: "Fun Fact!", aren: { position: "center", emotion: "surprise", message: "Regresi ada di mana-mana!" }, visual: { type: "funfact-card", icon: "📈", text: "Regresi adalah salah satu teknik ML tertua — sudah digunakan sejak tahun 1800-an! Jauh sebelum komputer ditemukan, matematikawan sudah menggunakan regresi untuk analisis data." } },
      { type: "quiz", title: "Mini Quiz", aren: { position: "bottom-right", emotion: "happy", message: "Yuk tes!" }, questions: [{ q: "Output regresi berupa...", opts: ["Kategori", "Angka kontinu", "Label kelas", "Gambar"], ans: "B" }, { q: "Contoh regresi:", opts: ["Deteksi spam", "Prediksi harga", "Face recognition", "Clustering"], ans: "B" }] }
    ],
    5: [
      { type: "cover", title: "Overfitting & Underfitting", aren: { position: "center-top", emotion: "wave", message: "Masalah klasik ML!" } },
      { type: "definition", title: "Overfitting: Model Terlalu Spesifik", aren: { position: "bottom-right", emotion: "think", message: "Overfitting = terlalu menghafal..." }, content: "Overfitting terjadi saat model terlalu 'menghafal' data training termasuk noise. Akibatnya: akurasi tinggi di training, tapi rendah di data baru.", visual: { type: "comparison-cards", cards: [{ type: "bad", title: "📉 Overfitting", text: "Akurasi training 99%\nAkurasi testing 60%\nModel menghafal data\n→ Gagal generalisasi" }, { type: "good", title: "✅ Optimal", text: "Akurasi training 85%\nAkurasi testing 83%\nModel belajar pola\n→ Generalisasi baik" }], caption: "Overfitting vs Model Optimal — beda tipis!" } },
      { type: "eli5", title: "ELI5: Overfitting", aren: { position: "left", emotion: "talk", message: "Kayak belajar ujian..." }, content: "Kamu hafal semua soal latihan BESERTA nomor halamannya. Pas ujian, soal beda dikit — kamu bingung. Itu overfitting. Seharusnya kamu paham KONSEP, bukan hafal soal.", visual: { type: "analogy-cards", cards: [{ icon: "📝", text: "Hafal soal\n+ nomor halaman" }, { icon: "❌", text: "Soal beda\ndikit → gagal" }, { icon: "💡", text: "Paham konsep\nbukan hafal" }, { icon: "✅", text: "Soal apapun\n→ bisa!" }], caption: "Pahami konsep, jangan hafal soal!" } },
      { type: "funfact", title: "Fun Fact!", aren: { position: "center", emotion: "surprise", message: "Overfitting ada di mana-mana!" }, visual: { type: "funfact-card", icon: "🎯", text: "Overfitting adalah masalah #1 dalam machine learning. Bahkan Google, Netflix, dan Tesla pun masih berjuang melawan overfitting di model-model AI mereka!" } },
      { type: "quiz", title: "Mini Quiz", aren: { position: "bottom-right", emotion: "happy", message: "Yuk tes!" }, questions: [{ q: "Overfitting artinya model...", opts: ["Terlalu sederhana", "Terlalu menghafal data", "Kurang data", "Kurang GPU"], ans: "B" }, { q: "Ciri overfitting:", opts: ["Training rendah, testing rendah", "Training tinggi, testing rendah", "Training rendah, testing tinggi", "Training tinggi, testing tinggi"], ans: "B" }] }
    ],
    6: [
      { type: "cover", title: "Evaluasi Model ML", aren: { position: "center-top", emotion: "wave", message: "Cara mengukur performa model!" } },
      { type: "definition", title: "Metrik Evaluasi Klasifikasi", aren: { position: "bottom-right", emotion: "think", message: "Akurasi aja nggak cukup..." }, content: "Accuracy, Precision, Recall, F1-Score — empat metrik utama untuk mengevaluasi model klasifikasi. Masing-masing punya kegunaan berbeda tergantung kasus.", visual: { type: "icon-grid", icons: ["🎯", "✅", "🔍", "⚖️"], labels: ["Accuracy\nTotal benar", "Precision\nTepat saat bilang Ya", "Recall\nMenemukan semua", "F1-Score\nKeseimbangan"], caption: "Empat metrik evaluasi klasifikasi!" } },
      { type: "eli5", title: "ELI5: Precision vs Recall", aren: { position: "left", emotion: "talk", message: "Bayangin deteksi spam..." }, content: "Precision: dari semua email yang kamu TANDAI spam, berapa yang BENAR-BENAR spam? Recall: dari semua email spam yang SEBENARNYA ada, berapa yang BERHASIL kamu temukan?", visual: { type: "comparison-cards", cards: [{ type: "good", title: "🎯 Precision", text: "'Kalau aku bilang ini spam, seberapa yakin?' — Penting saat FALSE ALARM berbiaya mahal." }, { type: "neutral", title: "🔍 Recall", text: "'Dari semua spam yang ada, berapa yang kutemukan?' — Penting saat KEHILANGAN deteksi berbahaya (penyakit)." }], caption: "Precision vs Recall — mana yang lebih penting tergantung kasus!" } },
      { type: "funfact", title: "Fun Fact!", aren: { position: "center", emotion: "surprise", message: "Menarik!" }, visual: { type: "funfact-card", icon: "📊", text: "Confusion matrix — tabel yang jadi dasar precision, recall, dan F1 — ditemukan oleh statistikawan Inggris pada tahun 1904, jauh sebelum AI ada!" } },
      { type: "quiz", title: "Mini Quiz", aren: { position: "bottom-right", emotion: "happy", message: "Quiz terakhir modul ini!" }, questions: [{ q: "Metrik yang menyeimbangkan precision & recall:", opts: ["Accuracy", "F1-Score", "MSE", "ROC"], ans: "B" }, { q: "Recall penting saat...", opts: ["False alarm mahal", "Kehilangan deteksi berbahaya", "Dataset besar", "Model lambat"], ans: "B" }] }
    ]
  }
};

// Fallback function — generik slide template untuk level yang belum didefinisikan
export function getSlides(moduleId, levelNumber, moduleObj, levelObj) {
  const moduleSlides = slidesDatabase[moduleId];
  if (moduleSlides && moduleSlides[levelNumber]) {
    return moduleSlides[levelNumber];
  }
  
  // Fallback: generate generic slides
  return [
    {
      type: "cover",
      title: levelObj.title,
      aren: { position: "center-top", emotion: "wave", message: `Yuk belajar ${levelObj.title}!` }
    },
    {
      type: "definition",
      title: levelObj.title,
      aren: { position: "bottom-right", emotion: "think", message: "Materi menarik nih..." },
      content: levelObj.summary
    },
    {
      type: "quiz",
      title: "Mini Quiz",
      aren: { position: "bottom-right", emotion: "happy", message: "Yuk tes pemahaman!" },
      questions: [
        { q: `Apa fokus utama dari ${levelObj.title}?`, opts: ["A. Meningkatkan AI", "B. Menghapus data", "C. Menulis kode", "D. Mengganti hardware"], ans: "A" }
      ]
    }
  ];
}
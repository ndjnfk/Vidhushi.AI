// Profile text for the kundli report (signs, planets, nakshatras, Lagna and
// Moon sign natures, planet-in-house meanings, dasha periods), in English
// and Hindi (other languages use English). Indexes follow apps/api/app/astro/constants.py:
// signs in RASHIS order, nakshatras in NAKSHATRAS order, houses 1-12.

import { RASHIS } from "@/lib/rashi";

export type ReadingLang = "en" | "hi";
export type Verdict = "strong" | "supported" | "steady" | "effort";

interface ReadingText {
  signs: string[];
  planets: Record<string, string>;
  nakshatras: string[];
  ordinal: (n: number) => string; // "7th" / "सातवें"
  lagna: string[];
  moon: string[];
  nakshatraText: string[];
  planetEffect: Record<string, string>;
  houseArea: string[];
  placement: (planet: string, house: string, effect: string, area: string) => string;
  dignity: { exalted: string; debilitated: string; own: string; retro: string };
  dasha: Record<string, string>;
  dashaPlacement: (lord: string, house: string, area: string) => string;
  until: (date: string) => string;
  verdictLabel: Record<Verdict, string>;
}

const EN_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

const en: ReadingText = {
  signs: RASHIS.map((r, i) => `${r} (${EN_SIGNS[i]})`),
  planets: { Sun: "Sun", Moon: "Moon", Mars: "Mars", Mercury: "Mercury", Jupiter: "Jupiter", Venus: "Venus", Saturn: "Saturn", Rahu: "Rahu", Ketu: "Ketu" },
  nakshatras: NAKSHATRAS,
  ordinal: (n) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`,
  lagna: [
    "Energetic, bold and quick to act. You like to lead, take initiative and face challenges head-on; patience is the lesson to learn.",
    "Steady, patient and loyal. You value comfort, beauty and security, and build things that last; stubbornness can hold you back.",
    "Curious, witty and adaptable. You think fast, communicate well and love learning; focusing on one thing at a time brings success.",
    "Caring, sensitive and protective. Home and family matter deeply to you and your intuition is strong; moods can change quickly.",
    "Confident, generous and dignified. People are naturally drawn to you and you like to lead; guard against pride.",
    "Practical, analytical and hard-working. You notice every detail and like to be useful; try not to over-worry or over-criticise.",
    "Charming, fair-minded and diplomatic. You seek balance, harmony and good partnerships; decisions can take time.",
    "Intense, determined and private. You go to the root of everything and rarely give up; learn to let go of old hurts.",
    "Optimistic, honest and freedom-loving. Travel, philosophy and learning attract you; your frankness can sometimes hurt others.",
    "Disciplined, ambitious and responsible. You work patiently towards long-term goals; make room for rest and joy too.",
    "Independent, original and humanitarian. You think differently and care about society; you can seem emotionally distant.",
    "Compassionate, imaginative and spiritual. You are intuitive and kind-hearted; set boundaries so others do not take advantage.",
  ],
  moon: [
    "Your emotions are quick and fiery — you react fast, recover fast, and need freedom and activity to feel happy.",
    "Emotionally stable and calm; comfort, good food, nature and dependable people make you feel secure.",
    "Your mind is restless and curious; conversation and variety keep you emotionally happy.",
    "Deeply emotional and nurturing; family, home and a sense of belonging give you peace.",
    "You need respect and appreciation to feel happy; you are warm-hearted and give generously.",
    "You handle feelings through thinking and doing; order, routine and helping others calm your mind.",
    "You need harmony and companionship; conflict unsettles you, while beauty and fairness soothe you.",
    "Your feelings are deep and private; trust takes time, but once given, your loyalty is complete.",
    "Emotionally optimistic and open; faith, freedom and meaningful goals keep your spirits high.",
    "You keep your emotions under control and feel secure through achievement and responsibility.",
    "You need space and friendship; you look at feelings rationally and care about the wider world.",
    "Highly sensitive and intuitive; music, prayer, art and quiet time restore your emotional energy.",
  ],
  nakshatraText: [
    "Quick, energetic and pioneering, with a natural healing touch.",
    "Strong-willed and responsible, able to carry heavy burdens and transform situations.",
    "Sharp, courageous and truthful, with the power to cut through confusion.",
    "Attractive, creative and fond of comfort; good growth and material blessings.",
    "Curious, gentle and always searching for something new.",
    "Intelligent and intense; the storms of life lead to renewal and deep insight.",
    "Optimistic and forgiving; the ability to bounce back and begin again.",
    "Nurturing, dependable and disciplined — one of the most auspicious nakshatras.",
    "Perceptive, clever and intuitive, with strong powers of persuasion.",
    "Dignified and proud of your roots; natural authority and respect for ancestors.",
    "Warm, creative and pleasure-loving; you enjoy art, romance and celebration.",
    "Generous, reliable and helpful; a loyal friend and partner.",
    "Skilful with your hands, clever and practical; you get things done.",
    "Artistic and stylish, with a fine eye for design and beauty.",
    "Independent and flexible; success through adaptability and business sense.",
    "Goal-driven and determined; you keep working until the target is reached.",
    "Devoted, friendly and disciplined; success through cooperation, often away from home.",
    "Protective and responsible, with leadership ability and inner strength.",
    "You seek the root truth of things; big changes lead to spiritual growth.",
    "Confident and persuasive, with a spirit that does not accept defeat.",
    "Principled, patient and victorious in the long run.",
    "A good listener and learner; gains through knowledge and connections.",
    "Musical, energetic and good with money; you do well in groups.",
    "Independent, private and healing; drawn to research and deep study.",
    "Idealistic and passionate, with a strong philosophical side.",
    "Wise, calm and self-controlled, with deep inner stability.",
    "Kind, gentle and protective; you guide and nourish others.",
  ],
  planetEffect: {
    Sun: "confidence, authority and recognition",
    Moon: "emotional involvement, sensitivity and ups and downs",
    Mars: "energy, courage and some conflict",
    Mercury: "intelligence, communication and skill",
    Jupiter: "wisdom, growth and blessings",
    Venus: "comfort, love and enjoyment",
    Saturn: "discipline, delays and slow but lasting results",
    Rahu: "strong desires, ambition and unusual experiences",
    Ketu: "detachment, spiritual insight and unexpected turns",
  },
  houseArea: [
    "your personality, health and direction in life",
    "family, speech and savings",
    "courage, siblings, communication and short journeys",
    "home, mother, property and peace of mind",
    "intelligence, education, children and romance",
    "daily work, illness, competition and debts",
    "marriage and partnerships",
    "longevity, sudden events, secrets and research",
    "luck, father, higher learning and faith",
    "career, status and reputation",
    "income, gains, friends and fulfilment of wishes",
    "expenses, foreign lands, sleep and spiritual liberation",
  ],
  placement: (planet, house, effect, area) => `${planet} in the ${house} house brings ${effect} to ${area}.`,
  dignity: {
    exalted: "Exalted — very strong here, so these results come easily.",
    debilitated: "Debilitated — weak here, so these results need extra effort; remedies can help.",
    own: "In its own sign — comfortable and strong.",
    retro: "Retrograde — its results work inwardly and may come after some delay.",
  },
  dasha: {
    Sun: "A period of authority, recognition and self-confidence; matters of father and government come into focus.",
    Moon: "An emotional, people-oriented period; home, mother, travel and public dealings are highlighted.",
    Mars: "An active, driven period; good for property, courage and competition, but control anger and haste.",
    Mercury: "A period of learning, business, communication and networking; the mind is sharp.",
    Jupiter: "A period of growth, wisdom and blessings; favourable for marriage, children, education and faith.",
    Venus: "A period of comfort, relationships, art and luxury; love and material pleasures increase.",
    Saturn: "A period of hard work and responsibility; results come slowly but last, rewarding discipline and patience.",
    Rahu: "A period of ambition and sudden change; foreign links, technology and new paths open up — think before big decisions.",
    Ketu: "A period of introspection and detachment; spiritual growth is strong while worldly matters may feel uncertain.",
  },
  until: (date) => `until ${date}`,
  dashaPlacement: (lord, house, area) => `${lord} sits in your ${house} house, so this period especially affects ${area}.`,
  verdictLabel: { strong: "Strong", supported: "Favourable", steady: "Steady", effort: "Needs care" },
};

const HI_ORDINAL = ["पहले", "दूसरे", "तीसरे", "चौथे", "पाँचवें", "छठे", "सातवें", "आठवें", "नौवें", "दसवें", "ग्यारहवें", "बारहवें"];

const hi: ReadingText = {
  signs: ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"],
  planets: { Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु" },
  nakshatras: [
    "अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा", "पुनर्वसु", "पुष्य", "आश्लेषा",
    "मघा", "पूर्वा फाल्गुनी", "उत्तरा फाल्गुनी", "हस्त", "चित्रा", "स्वाति", "विशाखा", "अनुराधा", "ज्येष्ठा",
    "मूल", "पूर्वाषाढ़ा", "उत्तराषाढ़ा", "श्रवण", "धनिष्ठा", "शतभिषा", "पूर्वा भाद्रपद", "उत्तरा भाद्रपद", "रेवती",
  ],
  ordinal: (n) => HI_ORDINAL[n - 1] ?? String(n),
  lagna: [
    "ऊर्जावान, साहसी और तुरंत काम करने वाले। आप नेतृत्व करना और चुनौतियों का सामना करना पसंद करते हैं; धैर्य सीखना आपका पाठ है।",
    "स्थिर, धैर्यवान और वफ़ादार। आप सुख, सुंदरता और सुरक्षा को महत्व देते हैं और टिकाऊ चीज़ें बनाते हैं; ज़िद कभी-कभी रुकावट बनती है।",
    "जिज्ञासु, हाज़िरजवाब और परिस्थिति के अनुसार ढलने वाले। आप तेज़ सोचते हैं और अच्छा बोलते हैं; एक समय में एक काम पर ध्यान देने से सफलता मिलती है।",
    "देखभाल करने वाले, संवेदनशील और रक्षा करने वाले। घर-परिवार आपके लिए बहुत मायने रखता है और आपका अंतर्ज्ञान प्रबल है; मूड जल्दी बदल सकता है।",
    "आत्मविश्वासी, उदार और गरिमामय। लोग स्वाभाविक रूप से आपकी ओर आकर्षित होते हैं और आप नेतृत्व करना पसंद करते हैं; अहंकार से बचें।",
    "व्यावहारिक, विश्लेषण करने वाले और मेहनती। आप हर बारीकी पर ध्यान देते हैं और उपयोगी बनना चाहते हैं; ज़्यादा चिंता और आलोचना से बचें।",
    "आकर्षक, न्यायप्रिय और कूटनीतिक। आप संतुलन, सामंजस्य और अच्छी साझेदारी चाहते हैं; निर्णय लेने में समय लग सकता है।",
    "गहरे, दृढ़ निश्चयी और निजी स्वभाव वाले। आप हर बात की तह तक जाते हैं और आसानी से हार नहीं मानते; पुरानी बातें मन में रखने से बचें।",
    "आशावादी, ईमानदार और स्वतंत्रता-प्रिय। यात्रा, दर्शन और ज्ञान आपको आकर्षित करते हैं; आपकी स्पष्टवादिता कभी-कभी दूसरों को चुभ सकती है।",
    "अनुशासित, महत्वाकांक्षी और ज़िम्मेदार। आप लंबे लक्ष्यों के लिए धैर्य से मेहनत करते हैं; आराम और आनंद को भी जगह दें।",
    "स्वतंत्र, मौलिक और समाज की भलाई सोचने वाले। आप अलग सोचते हैं और समाज की परवाह करते हैं; भावनात्मक रूप से दूर लग सकते हैं।",
    "दयालु, कल्पनाशील और आध्यात्मिक। आप अंतर्ज्ञानी और नरम दिल हैं; सीमाएँ तय करें ताकि कोई आपका फ़ायदा न उठाए।",
  ],
  moon: [
    "आपकी भावनाएँ तेज़ और जोशीली हैं — आप जल्दी प्रतिक्रिया देते हैं, जल्दी संभलते हैं और खुश रहने के लिए आपको स्वतंत्रता व सक्रियता चाहिए।",
    "भावनात्मक रूप से स्थिर और शांत; सुख-सुविधा, अच्छा भोजन, प्रकृति और भरोसेमंद लोग आपको सुरक्षित महसूस कराते हैं।",
    "आपका मन चंचल और जिज्ञासु है; बातचीत और विविधता आपको भावनात्मक रूप से खुश रखती है।",
    "गहरी भावनाओं वाले और पालन-पोषण करने वाले; परिवार, घर और अपनापन आपको शांति देते हैं।",
    "खुश रहने के लिए आपको सम्मान और सराहना चाहिए; आप गर्मजोशी वाले हैं और दिल खोलकर देते हैं।",
    "आप भावनाओं को सोच और काम के ज़रिए संभालते हैं; व्यवस्था, दिनचर्या और दूसरों की मदद से मन शांत रहता है।",
    "आपको सामंजस्य और साथ चाहिए; झगड़े आपको बेचैन करते हैं, जबकि सुंदरता और न्याय सुकून देते हैं।",
    "आपकी भावनाएँ गहरी और निजी हैं; भरोसा करने में समय लगता है, पर एक बार भरोसा हो जाए तो पूरी वफ़ादारी देते हैं।",
    "भावनात्मक रूप से आशावादी और खुले; आस्था, स्वतंत्रता और सार्थक लक्ष्य आपका उत्साह बनाए रखते हैं।",
    "आप भावनाओं पर नियंत्रण रखते हैं और उपलब्धि व ज़िम्मेदारी से सुरक्षित महसूस करते हैं।",
    "आपको स्वतंत्रता और मित्रता चाहिए; आप भावनाओं को तर्क से देखते हैं और बड़े समाज की परवाह करते हैं।",
    "बहुत संवेदनशील और अंतर्ज्ञानी; संगीत, प्रार्थना, कला और एकांत आपकी भावनात्मक ऊर्जा लौटाते हैं।",
  ],
  nakshatraText: [
    "तेज़, ऊर्जावान और अग्रणी; स्वाभाविक रूप से उपचार करने की क्षमता।",
    "दृढ़ इच्छाशक्ति वाले और ज़िम्मेदार; भारी ज़िम्मेदारियाँ उठाने और परिस्थितियाँ बदलने की क्षमता।",
    "तीक्ष्ण, साहसी और सत्यवादी; उलझनों को काटकर सच तक पहुँचने की शक्ति।",
    "आकर्षक, रचनात्मक और सुख-प्रिय; अच्छी वृद्धि और भौतिक सुख।",
    "जिज्ञासु, कोमल और हमेशा कुछ नया खोजने वाले।",
    "बुद्धिमान और तीव्र; जीवन के तूफ़ान नई शुरुआत और गहरी समझ लाते हैं।",
    "आशावादी और क्षमाशील; गिरकर फिर उठने और नई शुरुआत करने की क्षमता।",
    "पालन-पोषण करने वाले, भरोसेमंद और अनुशासित — सबसे शुभ नक्षत्रों में से एक।",
    "सूक्ष्म दृष्टि वाले, चतुर और अंतर्ज्ञानी; दूसरों को प्रभावित करने की प्रबल शक्ति।",
    "गरिमामय और अपनी परंपरा पर गर्व करने वाले; स्वाभाविक अधिकार और पूर्वजों के प्रति सम्मान।",
    "गर्मजोशी वाले, रचनात्मक और आनंद-प्रिय; कला, प्रेम और उत्सव पसंद।",
    "उदार, भरोसेमंद और मददगार; वफ़ादार मित्र और जीवनसाथी।",
    "हाथों के कुशल, चतुर और व्यावहारिक; काम पूरा करके ही दम लेते हैं।",
    "कलात्मक और आकर्षक; डिज़ाइन और सुंदरता की अच्छी समझ।",
    "स्वतंत्र और लचीले; अनुकूलन और व्यापारिक समझ से सफलता।",
    "लक्ष्य पर केंद्रित और दृढ़; लक्ष्य पूरा होने तक लगातार मेहनत करते हैं।",
    "समर्पित, मिलनसार और अनुशासित; सहयोग से सफलता, अक्सर घर से दूर।",
    "रक्षा करने वाले और ज़िम्मेदार; नेतृत्व क्षमता और आंतरिक शक्ति।",
    "हर बात की जड़ तक जाने वाले; बड़े बदलाव आध्यात्मिक उन्नति लाते हैं।",
    "आत्मविश्वासी और प्रभावशाली; कभी हार न मानने वाली भावना।",
    "सिद्धांतवादी, धैर्यवान और अंत में विजयी।",
    "अच्छे श्रोता और सीखने वाले; ज्ञान और संपर्कों से लाभ।",
    "संगीत-प्रेमी, ऊर्जावान और धन की समझ वाले; समूह में अच्छा प्रदर्शन।",
    "स्वतंत्र, निजी स्वभाव वाले और उपचारक; शोध और गहन अध्ययन की ओर झुकाव।",
    "आदर्शवादी और जोशीले; गहरी दार्शनिक सोच।",
    "बुद्धिमान, शांत और आत्म-नियंत्रित; गहरी आंतरिक स्थिरता।",
    "दयालु, कोमल और रक्षा करने वाले; दूसरों का मार्गदर्शन और पोषण करते हैं।",
  ],
  planetEffect: {
    Sun: "आत्मविश्वास, अधिकार और मान-सम्मान",
    Moon: "भावनात्मक जुड़ाव, संवेदनशीलता और उतार-चढ़ाव",
    Mars: "ऊर्जा, साहस और कुछ टकराव",
    Mercury: "बुद्धि, संवाद और कौशल",
    Jupiter: "ज्ञान, वृद्धि और आशीर्वाद",
    Venus: "सुख, प्रेम और आनंद",
    Saturn: "अनुशासन, देरी और धीमे पर स्थायी परिणाम",
    Rahu: "तीव्र इच्छाएँ, महत्वाकांक्षा और असामान्य अनुभव",
    Ketu: "वैराग्य, आध्यात्मिक समझ और अप्रत्याशित मोड़",
  },
  houseArea: [
    "आपके व्यक्तित्व, स्वास्थ्य और जीवन की दिशा",
    "परिवार, वाणी और बचत",
    "साहस, भाई-बहन, संवाद और छोटी यात्राओं",
    "घर, माता, संपत्ति और मन की शांति",
    "बुद्धि, शिक्षा, संतान और प्रेम",
    "दैनिक काम, रोग, प्रतिस्पर्धा और ऋण",
    "विवाह और साझेदारी",
    "आयु, अचानक घटनाओं, रहस्यों और शोध",
    "भाग्य, पिता, उच्च शिक्षा और धर्म",
    "करियर, पद और प्रतिष्ठा",
    "आय, लाभ, मित्रों और इच्छापूर्ति",
    "खर्च, विदेश, नींद और मोक्ष",
  ],
  placement: (planet, house, effect, area) => `${house} भाव में ${planet} — ${area} के मामलों में ${effect} देता है।`,
  dignity: {
    exalted: "उच्च का — यहाँ बहुत बलवान है, इसलिए ये फल आसानी से मिलते हैं।",
    debilitated: "नीच का — यहाँ कमज़ोर है, इसलिए अधिक प्रयास करना पड़ता है; उपाय सहायक हो सकते हैं।",
    own: "स्वराशि में — सहज और बलवान।",
    retro: "वक्री — इसके फल अंदरूनी रूप से और कुछ देरी से मिल सकते हैं।",
  },
  dasha: {
    Sun: "अधिकार, मान-सम्मान और आत्मविश्वास का समय; पिता और सरकार से जुड़े विषय महत्वपूर्ण रहते हैं।",
    Moon: "भावनाओं और लोगों से जुड़ाव का समय; घर, माता, यात्रा और जनसंपर्क पर ज़ोर रहता है।",
    Mars: "सक्रियता और जोश का समय; संपत्ति, साहस और प्रतिस्पर्धा के लिए अच्छा, पर क्रोध और जल्दबाज़ी पर नियंत्रण रखें।",
    Mercury: "पढ़ाई, व्यापार, संवाद और संपर्कों का समय; बुद्धि तेज़ रहती है।",
    Jupiter: "वृद्धि, ज्ञान और आशीर्वाद का समय; विवाह, संतान, शिक्षा और धर्म के लिए शुभ।",
    Venus: "सुख, संबंधों, कला और विलासिता का समय; प्रेम और भौतिक सुख बढ़ते हैं।",
    Saturn: "मेहनत और ज़िम्मेदारी का समय; फल धीरे पर स्थायी मिलते हैं, अनुशासन और धैर्य का पुरस्कार मिलता है।",
    Rahu: "महत्वाकांक्षा और अचानक बदलावों का समय; विदेश, तकनीक और नए रास्ते खुलते हैं — बड़े फ़ैसले सोच-समझकर लें।",
    Ketu: "आत्मचिंतन और वैराग्य का समय; आध्यात्मिक उन्नति होती है, जबकि सांसारिक मामले अनिश्चित लग सकते हैं।",
  },
  until: (date) => `${date} तक`,
  dashaPlacement: (lord, house, area) => `${lord} आपकी कुंडली के ${house} भाव में है, इसलिए यह समय विशेष रूप से ${area} को प्रभावित करता है।`,
  verdictLabel: { strong: "बलवान", supported: "अनुकूल", steady: "सामान्य", effort: "ध्यान दें" },
};

export const READING: Record<ReadingLang, ReadingText> = { en, hi };

export { NAKSHATRAS as NAKSHATRA_NAMES };

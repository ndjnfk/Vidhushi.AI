// Text for the kundli report tabs (predictions, doshas, dasha,
// basic details) in English and Hindi — plain language first, the
// astrology term alongside. Profile texts (signs, planets, nakshatras…)
// live in lib/kundliReading.ts.

import type { ManglikCancellation, PitraReason } from "@/lib/api";
import type { ReadingLang, Verdict } from "@/lib/kundliReading";

export type AreaKey = "health" | "mind" | "wealth" | "family" | "education" | "marriage" | "career" | "luck" | "income" | "travel";
export type TabKey = "basic" | "predictions" | "planets" | "chart" | "dosha" | "dasha";
export type DoshaKey = "manglik" | "kaalSarp" | "sadeSati" | "pitra";
type Severity = "none" | "cancelled" | "mild" | "strong";

interface ReportText {
  tabs: Record<TabKey, string>;
  title: string;
  basic: {
    birth: string; name: string; date: string; time: string; place: string; timezone: string;
    astro: string; lagna: string; rashi: string; rashiLord: string; nakshatra: string; nakshatraLord: string; pada: string; sunSign: string;
    avakhada: string; avakhadaHint: string; varna: string; vashya: string; yoni: string; gana: string; nadi: string; tatva: string;
    panchang: string; panchangHint: string;
    lucky: string; luckyHint: string; day: string; color: string; number: string; gem: string;
    values: Record<string, string>; // Avakhada values (Deva, Adi, Horse…) -> display
  };
  lucky: Record<string, { day: string; color: string; number: string; gem: string }>; // by planet
  predictions: {
    nature: string; lagna: string; moon: string; nakshatra: string;
    areasTitle: string; areasHint: string;
    strengths: string; care: string;
    areas: Record<AreaKey, { title: string; term: string; text: Record<Verdict, string> }>;
    goodPlanet: (planet: string, effect: string) => string;
    hardPlanet: (planet: string, effect: string) => string;
    now: string; nowHint: string;
  };
  planets: {
    intro: string; planet: string; sign: string; signLord: string; degree: string; nakshatra: string; nakLord: string;
    house: string; status: string; retro: string; ascendant: string; meaningTitle: string;
    status_: Record<"exalted" | "debilitated" | "own" | "", string>;
  };
  chart: { intro: string; d1: string; d1Hint: string; d9: string; d9Hint: string };
  dosha: {
    titles: Record<DoshaKey, string>;
    present: string; absent: string; cancelled: string; mild: string; running: string;
    whatIsIt: string;
    manglik: {
      meaning: string;
      heading: Record<Severity, string>;
      analysis: Record<Severity, string>;
      byHouse: string;
      fromLagna: (on: boolean, house: string) => string;
      fromMoon: (on: boolean, house: string) => string;
      fromVenus: (on: boolean) => string;
      byAspect: string;
      aspect: (planet: string) => string;
      noAspect: string;
      cancelTitle: string;
      cancel: Record<ManglikCancellation, string>;
    };
    kaalSarp: { meaning: string; present: (type: string) => string; absent: string; focus: (house: string, area: string) => string };
    sadeSati: {
      meaning: string;
      phase: (phase: "none" | "rising" | "peak" | "setting", sign: string) => string;
      dhaiya: Record<"fourth" | "eighth", string>;
      periods: string; from: string; to: string;
      when: Record<"past" | "now" | "next", string>;
    };
    pitra: { meaning: string; present: string; absent: string; reasons: Record<PitraReason, string> };
  };
  dasha: {
    intro: string; now: string; levels: string[]; planet: string; start: string; end: string;
    back: string; current: string; open: string; meaning: string;
  };
  disclaimer: string;
}

const en: ReportText = {
  tabs: { basic: "Basic Details", predictions: "Predictions", planets: "Planet Positions", chart: "Charts", dosha: "Dosha", dasha: "Dasha" },
  title: "Kundli Report",
  basic: {
    birth: "Birth details", name: "Name", date: "Date of birth", time: "Time of birth", place: "Place of birth", timezone: "Time zone",
    astro: "Astro details", lagna: "Lagna (Ascendant)", rashi: "Rashi (Moon sign)", rashiLord: "Rashi lord", nakshatra: "Nakshatra", nakshatraLord: "Nakshatra lord", pada: "Pada", sunSign: "Sun sign",
    avakhada: "Avakhada details", avakhadaHint: "Used for kundli matching before marriage.",
    varna: "Varna", vashya: "Vashya", yoni: "Yoni", gana: "Gana", nadi: "Nadi", tatva: "Tatva (element)",
    panchang: "Panchang at birth", panchangHint: "The Hindu calendar details of the day you were born.",
    lucky: "Favourable for you", luckyHint: "Based on the lord of your Lagna.",
    day: "Lucky day", color: "Lucky colour", number: "Lucky number", gem: "Gemstone",
    values: {
      Deva: "Deva (gentle, spiritual)", Manushya: "Manushya (practical, human)", Rakshasa: "Rakshasa (strong-willed, fierce)",
      Adi: "Adi", Madhya: "Madhya", Antya: "Antya",
      Fire: "Fire", Earth: "Earth", Air: "Air", Water: "Water",
      Chatushpada: "Chatushpada (four-legged)", Manava: "Manava (human)", Jalachara: "Jalachara (water)", Keeta: "Keeta (insect)",
    },
  },
  lucky: {
    Sun: { day: "Sunday", color: "Orange, gold", number: "1", gem: "Ruby (Manik)" },
    Moon: { day: "Monday", color: "White, silver", number: "2", gem: "Pearl (Moti)" },
    Mars: { day: "Tuesday", color: "Red", number: "9", gem: "Red Coral (Moonga)" },
    Mercury: { day: "Wednesday", color: "Green", number: "5", gem: "Emerald (Panna)" },
    Jupiter: { day: "Thursday", color: "Yellow", number: "3", gem: "Yellow Sapphire (Pukhraj)" },
    Venus: { day: "Friday", color: "White, pink", number: "6", gem: "Diamond / Opal" },
    Saturn: { day: "Saturday", color: "Blue, black", number: "8", gem: "Blue Sapphire (Neelam)" },
  },
  predictions: {
    nature: "Your nature", lagna: "How you are (Lagna)", moon: "Your mind (Moon sign)", nakshatra: "Your inner nature (Nakshatra)",
    areasTitle: "Life predictions", areasHint: "What your chart says about each part of your life.",
    strengths: "Your strong areas", care: "Areas that need care",
    areas: {
      health: { title: "Health", term: "1st house", text: {
        strong: "Your body has good natural strength and recovery power. With a steady routine you should enjoy good health for most of your life.",
        supported: "Health is generally good. Small problems get sorted out quickly as long as you don't ignore them.",
        steady: "Health is average — neither weak nor very strong. Regular sleep, simple food and some exercise will make a big difference.",
        effort: "Your energy can dip and small health problems may keep coming back. Don't skip check-ups, avoid junk food and stress, and rest when your body asks for it.",
      } },
      mind: { title: "Mind & emotions", term: "Moon", text: {
        strong: "Your mind is calm and emotionally strong. You handle pressure well and people find comfort in you.",
        supported: "Emotionally you are mostly balanced; good company and family keep you happy.",
        steady: "Your mood goes up and down with circumstances. Talking things through and a regular routine help you stay balanced.",
        effort: "You may overthink, worry or feel low at times. Meditation, prayer and sharing your feelings with people you trust will help a lot.",
      } },
      wealth: { title: "Money & savings", term: "2nd house", text: {
        strong: "Money comes to you steadily and you know how to save. Family support and your own speech and skills bring good income.",
        supported: "Finances improve with effort. Saving regularly will build good wealth over time.",
        steady: "Income and expenses stay balanced. Plan your budget and avoid risky investments.",
        effort: "Money may come and go quickly. Avoid lending, gambling and big loans; build savings slowly and steadily.",
      } },
      family: { title: "Home, mother & property", term: "4th house", text: {
        strong: "A happy home, good support from your mother and a good chance of owning property and vehicles.",
        supported: "Home life is mostly peaceful; property and comforts come with effort.",
        steady: "Family life has the normal ups and downs. Spending time at home keeps relations warm.",
        effort: "There may be some unrest at home or delays in buying property. Patience and respect for elders bring peace.",
      } },
      education: { title: "Education & children", term: "5th house", text: {
        strong: "A sharp mind and good results in studies. Children are likely to bring you joy and pride.",
        supported: "Studies go well with steady effort, and children bring happiness.",
        steady: "Studies give average results; focus and discipline will improve them. Matters of children stay normal.",
        effort: "Concentration may waver and studies may need extra effort. Delays or worries about children are possible — stay patient.",
      } },
      marriage: { title: "Love & marriage", term: "7th house", text: {
        strong: "Good chances of a loving, supportive partner and a stable marriage. Business partnerships also do well.",
        supported: "Marriage and partnerships are favourable; understanding each other keeps the bond strong.",
        steady: "Married life is normal, with the usual ups and downs. Clear, honest talk is the key.",
        effort: "Delays in marriage or misunderstandings with your partner are possible. Patience, trust and — if needed — remedies help.",
      } },
      career: { title: "Career & work", term: "10th house", text: {
        strong: "Strong career potential. You can rise to a good position, earn respect and be recognised for your work.",
        supported: "Your career grows steadily with hard work. Promotions and recognition come in time.",
        steady: "Your career moves at a normal pace. Keep learning new skills to move ahead faster.",
        effort: "Your career may see struggle, changes or slow growth. Stay consistent and avoid conflicts at work — your efforts will pay off.",
      } },
      luck: { title: "Luck & father", term: "9th house", text: {
        strong: "Luck is on your side. Elders, teachers and your father support you, and your faith is strong.",
        supported: "Fortune helps when you make the effort; good guidance comes at the right time.",
        steady: "Luck is average — your own hard work matters most.",
        effort: "At times you may feel luck is not with you. Respect elders, help others and stay patient — fortune improves with good deeds.",
      } },
      income: { title: "Income & friends", term: "11th house", text: {
        strong: "Good income and gains, with helpful friends and contacts. Most of your wishes get fulfilled.",
        supported: "Income grows with effort; friends and your network help you.",
        steady: "Gains are steady but not sudden. Good contacts will bring more opportunities.",
        effort: "Income may be irregular and friends may not always help. Rely on your own planning.",
      } },
      travel: { title: "Travel, abroad & expenses", term: "12th house", text: {
        strong: "Good chances of foreign travel or settling abroad, and money spent on good causes brings peace.",
        supported: "Travel and foreign connections can help you; expenses stay under control.",
        steady: "Normal expenses and occasional travel. Keep an eye on spending.",
        effort: "Expenses may rise suddenly and sleep can be disturbed. Budget carefully; spiritual practice brings peace.",
      } },
    },
    goodPlanet: (planet, effect) => `${planet} here is a good sign — it brings ${effect}.`,
    hardPlanet: (planet, effect) => `${planet} here brings ${effect}; handle this area with patience.`,
    now: "What's happening now", nowHint: "Your current planetary period (dasha).",
  },
  planets: {
    intro: "Where each planet was at the moment you were born.",
    planet: "Planet", sign: "Sign", signLord: "Sign lord", degree: "Degree", nakshatra: "Nakshatra", nakLord: "Nakshatra lord",
    house: "House", status: "Strength", retro: "R = retrograde", ascendant: "Ascendant (Lagna)",
    meaningTitle: "What each planet means for you",
    status_: { exalted: "Exalted (very strong)", debilitated: "Debilitated (weak)", own: "Own sign (strong)", "": "—" },
  },
  chart: {
    intro: "Your birth charts. Switch between the North and South Indian styles.",
    d1: "Rashi chart (D1)", d1Hint: "The main birth chart — your whole life.",
    d9: "Navamsa chart (D9)", d9Hint: "Shows the strength of planets and your married life.",
  },
  dosha: {
    titles: { manglik: "Manglik Dosha", kaalSarp: "Kaal Sarp Dosha", sadeSati: "Shani Sade Sati", pitra: "Pitra Dosha" },
    present: "Present", absent: "Not present", cancelled: "Cancelled", mild: "Mild", running: "Running",
    whatIsIt: "What is it?",
    manglik: {
      meaning: "Manglik Dosha comes from Mars (Mangal). When Mars sits in certain houses it can bring anger, arguments or delays in married life. Many charts are slightly Manglik, and other planets often cancel it.",
      heading: { none: "No Manglik Dosha", cancelled: "Manglik Dosha — cancelled", mild: "Manglik Dosha — mild (less effective)", strong: "Manglik Dosha — present" },
      analysis: {
        none: "Mars is not in a Manglik position in your chart, so there is no Manglik Dosha.",
        cancelled: "Mars is in a Manglik position, but other factors in your chart cancel it, so the dosha has little or no effect.",
        mild: "Manglik Dosha is present but mild. Simple remedies can reduce its effect further.",
        strong: "Manglik Dosha is present from more than one point in your chart. Matching with a Manglik partner, or doing remedies before marriage, is advised.",
      },
      byHouse: "Based on houses",
      fromLagna: (on, house) => on ? `From your Lagna, Mars is in the ${house} house — a Manglik position.` : `From your Lagna, Mars is in the ${house} house — not a Manglik position.`,
      fromMoon: (on, house) => on ? `From your Moon sign, Mars is in the ${house} house — a Manglik position.` : `From your Moon sign, Mars is in the ${house} house — not a Manglik position.`,
      fromVenus: (on) => on ? "Counted from Venus, Mars is also in a Manglik position." : "Counted from Venus, Mars is not in a Manglik position.",
      byAspect: "Based on aspects (planets looking at your house of marriage)",
      aspect: (planet) => `${planet} is aspecting (looking at) your 7th house of marriage.`,
      noAspect: "No harsh planet is aspecting your 7th house of marriage — a good sign.",
      cancelTitle: "Cancellation rules found in your chart",
      cancel: {
        mars_strong_sign: "Mars is in its own or exalted sign (Mesha, Vrischika or Makara), which cancels the dosha.",
        house_sign: "Mars is in a house-and-sign combination that classical rules treat as cancelling Manglik Dosha.",
        jupiter_with_mars: "Jupiter sits together with Mars and calms its effect.",
        jupiter_aspects_mars: "Jupiter looks at Mars and calms its effect.",
        benefic_in_lagna: "Jupiter or Venus in your Lagna (1st house) protects married life and cancels the dosha.",
      },
    },
    kaalSarp: {
      meaning: "Kaal Sarp Dosha forms when all seven planets are hemmed in between Rahu and Ketu. It can bring struggles, fears and delays early in life, but people with it often rise very high later.",
      present: (type) => `Kaal Sarp Dosha is present in your chart — ${type} Kaal Sarp.`,
      absent: "Kaal Sarp Dosha is not present — your planets are not all between Rahu and Ketu.",
      focus: (house, area) => `Its effect is felt mostly through your ${house} house: ${area}.`,
    },
    sadeSati: {
      meaning: "Sade Sati is the 7½-year period when Saturn passes over your Moon sign and the signs on either side. It brings hard work, responsibility and life lessons — and also maturity and lasting results.",
      phase: (phase, sign) => ({
        rising: `Sade Sati is running now — first phase. Saturn is moving through ${sign}, the sign before your Moon sign. Expect more responsibility and expenses; stay disciplined.`,
        peak: `Sade Sati is running now — peak phase. Saturn is moving through your Moon sign (${sign}). This is the most demanding phase: work hard, stay patient and avoid shortcuts.`,
        setting: `Sade Sati is running now — final phase. Saturn is in ${sign}, the sign after your Moon sign. Pressure eases gradually and the lessons turn into lasting results.`,
        none: `Sade Sati is not running at present (Saturn is now moving through ${sign}).`,
      })[phase],
      dhaiya: {
        fourth: "Shani Dhaiya (small panoti) is running: Saturn is in the 4th sign from your Moon. Home life and peace of mind need attention.",
        eighth: "Shani Dhaiya (small panoti) is running: Saturn is in the 8th sign from your Moon. Take care of health and avoid risky decisions.",
      },
      periods: "Sade Sati periods in your life", from: "From", to: "To",
      when: { past: "Past", now: "Running now", next: "Upcoming" },
    },
    pitra: {
      meaning: "Pitra Dosha is linked to your ancestors. It can bring obstacles in progress, family life or children until the ancestors are honoured.",
      present: "Pitra Dosha is present in your chart.",
      absent: "Pitra Dosha is not present in your chart.",
      reasons: {
        sun_rahu: "The Sun (father, ancestors) is together with Rahu.",
        sun_ketu: "The Sun (father, ancestors) is together with Ketu.",
        sun_saturn: "The Sun (father, ancestors) is together with Saturn.",
        rahu_9th: "Rahu is in your 9th house — the house of father and ancestors.",
      },
    },
  },
  dasha: {
    intro: "Vimshottari Dasha divides your life into planetary periods. The planet whose period is running colours what you experience. Tap a period to see its smaller sub-periods.",
    now: "Running now",
    levels: ["Mahadasha", "Antardasha", "Pratyantar Dasha", "Sookshma Dasha", "Prana Dasha"],
    planet: "Planet", start: "Start", end: "End", back: "Back", current: "Now", open: "Open sub-periods",
    meaning: "What this period means for you",
  },
  disclaimer: "This report is generated automatically from standard Vedic astrology rules. A full reading also considers yogas, divisional charts and your personal situation — for personal guidance, book a consultation.",
};

const hi: ReportText = {
  tabs: { basic: "मूल विवरण", predictions: "भविष्यफल", planets: "ग्रह स्थिति", chart: "कुंडली चार्ट", dosha: "दोष", dasha: "दशा" },
  title: "कुंडली रिपोर्ट",
  basic: {
    birth: "जन्म विवरण", name: "नाम", date: "जन्म तिथि", time: "जन्म समय", place: "जन्म स्थान", timezone: "समय क्षेत्र",
    astro: "ज्योतिषीय विवरण", lagna: "लग्न", rashi: "राशि (चंद्र राशि)", rashiLord: "राशि स्वामी", nakshatra: "नक्षत्र", nakshatraLord: "नक्षत्र स्वामी", pada: "चरण", sunSign: "सूर्य राशि",
    avakhada: "अवकहड़ा चक्र", avakhadaHint: "विवाह से पहले कुंडली मिलान में काम आता है।",
    varna: "वर्ण", vashya: "वश्य", yoni: "योनि", gana: "गण", nadi: "नाड़ी", tatva: "तत्व",
    panchang: "जन्म के समय पंचांग", panchangHint: "आपके जन्म के दिन का हिंदू पंचांग।",
    lucky: "आपके लिए शुभ", luckyHint: "आपके लग्न स्वामी के आधार पर।",
    day: "शुभ दिन", color: "शुभ रंग", number: "शुभ अंक", gem: "रत्न",
    values: {
      Brahmin: "ब्राह्मण", Kshatriya: "क्षत्रिय", Vaishya: "वैश्य", Shudra: "शूद्र",
      Chatushpada: "चतुष्पद", Manava: "मानव", Jalachara: "जलचर", Keeta: "कीट",
      Horse: "अश्व", Elephant: "गज", Sheep: "मेष", Serpent: "सर्प", Dog: "श्वान", Cat: "मार्जार", Rat: "मूषक",
      Cow: "गौ", Buffalo: "महिष", Tiger: "व्याघ्र", Deer: "मृग", Monkey: "वानर", Mongoose: "नकुल", Lion: "सिंह",
      Deva: "देव (सौम्य, आध्यात्मिक)", Manushya: "मनुष्य (व्यावहारिक)", Rakshasa: "राक्षस (दृढ़, तेजस्वी)",
      Adi: "आदि", Madhya: "मध्य", Antya: "अंत्य",
      Fire: "अग्नि", Earth: "पृथ्वी", Air: "वायु", Water: "जल",
    },
  },
  lucky: {
    Sun: { day: "रविवार", color: "नारंगी, सुनहरा", number: "1", gem: "माणिक" },
    Moon: { day: "सोमवार", color: "सफ़ेद, चाँदी", number: "2", gem: "मोती" },
    Mars: { day: "मंगलवार", color: "लाल", number: "9", gem: "मूंगा" },
    Mercury: { day: "बुधवार", color: "हरा", number: "5", gem: "पन्ना" },
    Jupiter: { day: "गुरुवार", color: "पीला", number: "3", gem: "पुखराज" },
    Venus: { day: "शुक्रवार", color: "सफ़ेद, गुलाबी", number: "6", gem: "हीरा / ओपल" },
    Saturn: { day: "शनिवार", color: "नीला, काला", number: "8", gem: "नीलम" },
  },
  predictions: {
    nature: "आपका स्वभाव", lagna: "आप कैसे हैं (लग्न)", moon: "आपका मन (चंद्र राशि)", nakshatra: "आपका भीतरी स्वभाव (नक्षत्र)",
    areasTitle: "जीवन का भविष्यफल", areasHint: "आपकी कुंडली जीवन के हर हिस्से के बारे में क्या कहती है।",
    strengths: "आपके मज़बूत पक्ष", care: "जिन पर ध्यान देना है",
    areas: {
      health: { title: "स्वास्थ्य", term: "पहला भाव", text: {
        strong: "आपके शरीर में अच्छी प्राकृतिक ताकत और जल्दी ठीक होने की क्षमता है। नियमित दिनचर्या रखें तो ज़्यादातर जीवन अच्छा स्वास्थ्य रहेगा।",
        supported: "स्वास्थ्य आमतौर पर अच्छा रहता है। छोटी समस्याओं को नज़रअंदाज़ न करें तो वे जल्दी ठीक हो जाती हैं।",
        steady: "स्वास्थ्य सामान्य है — न बहुत कमज़ोर, न बहुत मज़बूत। अच्छी नींद, सादा भोजन और थोड़ा व्यायाम बड़ा फ़र्क लाएगा।",
        effort: "ऊर्जा कभी-कभी कम हो सकती है और छोटी बीमारियाँ बार-बार आ सकती हैं। जाँच करवाते रहें, जंक फ़ूड और तनाव से बचें, और शरीर को आराम दें।",
      } },
      mind: { title: "मन और भावनाएँ", term: "चंद्रमा", text: {
        strong: "आपका मन शांत और भावनात्मक रूप से मज़बूत है। आप दबाव अच्छे से संभालते हैं और लोग आपसे सुकून पाते हैं।",
        supported: "भावनात्मक रूप से आप ज़्यादातर संतुलित रहते हैं; अच्छी संगत और परिवार आपको खुश रखते हैं।",
        steady: "परिस्थितियों के साथ आपका मूड ऊपर-नीचे होता है। बात करना और नियमित दिनचर्या संतुलन बनाए रखते हैं।",
        effort: "कभी-कभी आप ज़्यादा सोच सकते हैं, चिंता कर सकते हैं या उदास महसूस कर सकते हैं। ध्यान, प्रार्थना और भरोसेमंद लोगों से मन की बात कहना बहुत मदद करेगा।",
      } },
      wealth: { title: "धन और बचत", term: "दूसरा भाव", text: {
        strong: "धन लगातार आता है और आप बचत करना जानते हैं। परिवार का साथ और आपकी वाणी व कौशल अच्छी आय देते हैं।",
        supported: "मेहनत से आर्थिक स्थिति सुधरती है। नियमित बचत समय के साथ अच्छा धन बनाएगी।",
        steady: "आय और खर्च संतुलित रहते हैं। बजट बनाकर चलें और जोखिम भरे निवेश से बचें।",
        effort: "धन जल्दी आ-जा सकता है। उधार देने, जुए और बड़े कर्ज़ से बचें; धीरे-धीरे बचत बढ़ाएँ।",
      } },
      family: { title: "घर, माता और संपत्ति", term: "चौथा भाव", text: {
        strong: "सुखी घर, माता का अच्छा साथ और संपत्ति व वाहन मिलने के अच्छे योग।",
        supported: "घर का माहौल ज़्यादातर शांत रहता है; संपत्ति और सुख-सुविधाएँ मेहनत से मिलती हैं।",
        steady: "पारिवारिक जीवन में सामान्य उतार-चढ़ाव रहते हैं। घर पर समय बिताने से रिश्ते मधुर रहते हैं।",
        effort: "घर में कुछ अशांति या संपत्ति खरीदने में देरी हो सकती है। धैर्य और बड़ों का सम्मान शांति लाता है।",
      } },
      education: { title: "शिक्षा और संतान", term: "पाँचवाँ भाव", text: {
        strong: "तेज़ दिमाग़ और पढ़ाई में अच्छे परिणाम। संतान से सुख और गर्व मिलने के योग हैं।",
        supported: "लगातार मेहनत से पढ़ाई अच्छी चलती है, और संतान सुख देती है।",
        steady: "पढ़ाई में सामान्य परिणाम; एकाग्रता और अनुशासन से सुधार होगा। संतान के विषय सामान्य रहते हैं।",
        effort: "एकाग्रता डगमगा सकती है और पढ़ाई में अधिक मेहनत लग सकती है। संतान से जुड़ी देरी या चिंता संभव है — धैर्य रखें।",
      } },
      marriage: { title: "प्रेम और विवाह", term: "सातवाँ भाव", text: {
        strong: "प्यार करने वाला, साथ देने वाला जीवनसाथी और स्थिर वैवाहिक जीवन मिलने के अच्छे योग। व्यापार की साझेदारी भी सफल रहती है।",
        supported: "विवाह और साझेदारी शुभ हैं; एक-दूसरे को समझने से रिश्ता मज़बूत रहता है।",
        steady: "वैवाहिक जीवन सामान्य उतार-चढ़ाव के साथ चलता है। खुलकर और ईमानदारी से बात करना ज़रूरी है।",
        effort: "विवाह में देरी या जीवनसाथी से ग़लतफ़हमी हो सकती है। धैर्य, भरोसा और ज़रूरत हो तो उपाय मदद करते हैं।",
      } },
      career: { title: "करियर और काम", term: "दसवाँ भाव", text: {
        strong: "करियर में बड़ी संभावनाएँ। आप अच्छे पद तक पहुँच सकते हैं, सम्मान पा सकते हैं और आपके काम की पहचान होगी।",
        supported: "मेहनत से करियर लगातार आगे बढ़ता है। पदोन्नति और पहचान समय पर मिलती है।",
        steady: "करियर सामान्य गति से चलता है। नए कौशल सीखते रहें तो तेज़ी से आगे बढ़ेंगे।",
        effort: "करियर में संघर्ष, बदलाव या धीमी प्रगति हो सकती है। लगातार मेहनत करें और काम पर विवाद से बचें — मेहनत का फल ज़रूर मिलेगा।",
      } },
      luck: { title: "भाग्य और पिता", term: "नौवाँ भाव", text: {
        strong: "भाग्य आपके साथ है। बड़े, गुरु और पिता आपका साथ देते हैं, और आपकी आस्था मज़बूत है।",
        supported: "प्रयास करने पर भाग्य साथ देता है; सही समय पर अच्छा मार्गदर्शन मिलता है।",
        steady: "भाग्य सामान्य है — आपकी अपनी मेहनत सबसे ज़्यादा मायने रखती है।",
        effort: "कभी-कभी लगेगा कि भाग्य साथ नहीं दे रहा। बड़ों का सम्मान करें, दूसरों की मदद करें और धैर्य रखें — अच्छे कर्मों से भाग्य सुधरता है।",
      } },
      income: { title: "आय और मित्र", term: "ग्यारहवाँ भाव", text: {
        strong: "अच्छी आय और लाभ, साथ में मददगार मित्र और संपर्क। ज़्यादातर इच्छाएँ पूरी होती हैं।",
        supported: "मेहनत से आय बढ़ती है; मित्र और संपर्क मदद करते हैं।",
        steady: "लाभ स्थिर रहता है, अचानक नहीं। अच्छे संपर्क बनाएँ तो अवसर बढ़ेंगे।",
        effort: "आय अनियमित हो सकती है और मित्र हमेशा साथ न दें। अपनी योजना पर भरोसा रखें।",
      } },
      travel: { title: "यात्रा, विदेश और खर्च", term: "बारहवाँ भाव", text: {
        strong: "विदेश यात्रा या विदेश में बसने के अच्छे योग, और अच्छे कामों में किया गया खर्च शांति देता है।",
        supported: "यात्रा और विदेश से जुड़ाव लाभ दे सकते हैं; खर्च नियंत्रण में रहते हैं।",
        steady: "सामान्य खर्च और कभी-कभी यात्रा। खर्चों पर नज़र रखें।",
        effort: "खर्च अचानक बढ़ सकते हैं और नींद में खलल हो सकता है। सोच-समझकर बजट बनाएँ; आध्यात्मिक साधना शांति देगी।",
      } },
    },
    goodPlanet: (planet, effect) => `यहाँ ${planet} शुभ संकेत है — ${effect} देता है।`,
    hardPlanet: (planet, effect) => `यहाँ ${planet} ${effect} देता है; इस क्षेत्र में धैर्य रखें।`,
    now: "अभी क्या चल रहा है", nowHint: "आपकी वर्तमान ग्रह दशा।",
  },
  planets: {
    intro: "आपके जन्म के समय हर ग्रह कहाँ था।",
    planet: "ग्रह", sign: "राशि", signLord: "राशि स्वामी", degree: "अंश", nakshatra: "नक्षत्र", nakLord: "नक्षत्र स्वामी",
    house: "भाव", status: "बल", retro: "R = वक्री", ascendant: "लग्न",
    meaningTitle: "हर ग्रह आपके लिए क्या कहता है",
    status_: { exalted: "उच्च (बहुत बलवान)", debilitated: "नीच (कमज़ोर)", own: "स्वराशि (बलवान)", "": "—" },
  },
  chart: {
    intro: "आपकी जन्म कुंडली। उत्तर और दक्षिण भारतीय शैली में बदल सकते हैं।",
    d1: "राशि कुंडली (D1)", d1Hint: "मुख्य जन्म कुंडली — पूरा जीवन।",
    d9: "नवांश कुंडली (D9)", d9Hint: "ग्रहों का बल और वैवाहिक जीवन दिखाती है।",
  },
  dosha: {
    titles: { manglik: "मांगलिक दोष", kaalSarp: "काल सर्प दोष", sadeSati: "शनि की साढ़ेसाती", pitra: "पितृ दोष" },
    present: "है", absent: "नहीं है", cancelled: "भंग", mild: "हल्का", running: "चल रही है",
    whatIsIt: "यह क्या है?",
    manglik: {
      meaning: "मांगलिक दोष मंगल ग्रह से बनता है। जब मंगल कुछ ख़ास भावों में होता है तो वैवाहिक जीवन में क्रोध, झगड़े या देरी ला सकता है। कई कुंडलियाँ थोड़ी मांगलिक होती हैं और अक्सर दूसरे ग्रह इसे भंग कर देते हैं।",
      heading: { none: "मांगलिक दोष नहीं है", cancelled: "मांगलिक दोष — भंग", mild: "मांगलिक दोष — हल्का (कम प्रभावी)", strong: "मांगलिक दोष — है" },
      analysis: {
        none: "आपकी कुंडली में मंगल मांगलिक स्थिति में नहीं है, इसलिए मांगलिक दोष नहीं है।",
        cancelled: "मंगल मांगलिक स्थिति में है, पर कुंडली के दूसरे योग इसे भंग कर देते हैं, इसलिए दोष का असर बहुत कम या नहीं के बराबर है।",
        mild: "मांगलिक दोष है पर हल्का है। सरल उपायों से इसका असर और कम हो सकता है।",
        strong: "आपकी कुंडली में एक से अधिक आधार से मांगलिक दोष है। विवाह के लिए मांगलिक जीवनसाथी से मिलान या विवाह से पहले उपाय करने की सलाह दी जाती है।",
      },
      byHouse: "भावों के आधार पर",
      fromLagna: (on, house) => on ? `लग्न से मंगल ${house} भाव में है — मांगलिक स्थिति।` : `लग्न से मंगल ${house} भाव में है — मांगलिक स्थिति नहीं।`,
      fromMoon: (on, house) => on ? `चंद्र राशि से मंगल ${house} भाव में है — मांगलिक स्थिति।` : `चंद्र राशि से मंगल ${house} भाव में है — मांगलिक स्थिति नहीं।`,
      fromVenus: (on) => on ? "शुक्र से गिनने पर भी मंगल मांगलिक स्थिति में है।" : "शुक्र से गिनने पर मंगल मांगलिक स्थिति में नहीं है।",
      byAspect: "दृष्टि के आधार पर (विवाह भाव पर नज़र डालने वाले ग्रह)",
      aspect: (planet) => `${planet} आपके सातवें (विवाह) भाव पर दृष्टि डाल रहा है।`,
      noAspect: "कोई क्रूर ग्रह आपके सातवें (विवाह) भाव पर दृष्टि नहीं डाल रहा — शुभ संकेत।",
      cancelTitle: "आपकी कुंडली में दोष भंग के नियम",
      cancel: {
        mars_strong_sign: "मंगल अपनी स्वराशि या उच्च राशि (मेष, वृश्चिक या मकर) में है, जिससे दोष भंग होता है।",
        house_sign: "मंगल ऐसे भाव और राशि के मेल में है जिसे शास्त्रों में मांगलिक दोष का भंग माना गया है।",
        jupiter_with_mars: "गुरु मंगल के साथ है और उसके असर को शांत करता है।",
        jupiter_aspects_mars: "गुरु की दृष्टि मंगल पर है, जो उसके असर को शांत करती है।",
        benefic_in_lagna: "लग्न (पहले भाव) में गुरु या शुक्र वैवाहिक जीवन की रक्षा करते हैं और दोष भंग करते हैं।",
      },
    },
    kaalSarp: {
      meaning: "काल सर्प दोष तब बनता है जब सातों ग्रह राहु और केतु के बीच आ जाते हैं। इससे जीवन की शुरुआत में संघर्ष, डर और देरी हो सकती है, पर ऐसे लोग अक्सर बाद में बहुत ऊँचाई तक पहुँचते हैं।",
      present: (type) => `आपकी कुंडली में काल सर्प दोष है — ${type} काल सर्प।`,
      absent: "काल सर्प दोष नहीं है — आपके सभी ग्रह राहु-केतु के बीच नहीं हैं।",
      focus: (house, area) => `इसका असर मुख्य रूप से आपके ${house} भाव से जुड़े मामलों पर होता है: ${area}।`,
    },
    sadeSati: {
      meaning: "साढ़ेसाती साढ़े सात साल का वह समय है जब शनि आपकी चंद्र राशि और उसके आगे-पीछे की राशियों से गुज़रता है। यह मेहनत, ज़िम्मेदारी और जीवन के सबक लाती है — और साथ में परिपक्वता और स्थायी फल भी।",
      phase: (phase, sign) => ({
        rising: `साढ़ेसाती अभी चल रही है — पहला चरण। शनि ${sign} राशि में है, जो आपकी चंद्र राशि से पहले की राशि है। ज़िम्मेदारियाँ और खर्च बढ़ सकते हैं; अनुशासन बनाए रखें।`,
        peak: `साढ़ेसाती अभी चल रही है — मध्य (चरम) चरण। शनि आपकी चंद्र राशि (${sign}) में है। यह सबसे कठिन चरण है: मेहनत करें, धैर्य रखें और शॉर्टकट से बचें।`,
        setting: `साढ़ेसाती अभी चल रही है — अंतिम चरण। शनि ${sign} राशि में है, जो आपकी चंद्र राशि के बाद की राशि है। दबाव धीरे-धीरे कम होता है और सीख स्थायी फल में बदलती है।`,
        none: `अभी साढ़ेसाती नहीं चल रही है (शनि इस समय ${sign} राशि में है)।`,
      })[phase],
      dhaiya: {
        fourth: "शनि की ढैय्या (छोटी पनौती) चल रही है: शनि आपकी चंद्र राशि से चौथी राशि में है। घर और मन की शांति पर ध्यान दें।",
        eighth: "शनि की ढैय्या (छोटी पनौती) चल रही है: शनि आपकी चंद्र राशि से आठवीं राशि में है। स्वास्थ्य का ध्यान रखें और जोखिम भरे फ़ैसलों से बचें।",
      },
      periods: "आपके जीवन में साढ़ेसाती के समय", from: "से", to: "तक",
      when: { past: "बीत चुकी", now: "अभी चल रही", next: "आने वाली" },
    },
    pitra: {
      meaning: "पितृ दोष आपके पूर्वजों से जुड़ा है। जब तक पूर्वजों का सम्मान और तर्पण न हो, यह प्रगति, पारिवारिक जीवन या संतान में रुकावटें ला सकता है।",
      present: "आपकी कुंडली में पितृ दोष है।",
      absent: "आपकी कुंडली में पितृ दोष नहीं है।",
      reasons: {
        sun_rahu: "सूर्य (पिता, पूर्वज) राहु के साथ है।",
        sun_ketu: "सूर्य (पिता, पूर्वज) केतु के साथ है।",
        sun_saturn: "सूर्य (पिता, पूर्वज) शनि के साथ है।",
        rahu_9th: "राहु आपके नौवें भाव में है — जो पिता और पूर्वजों का भाव है।",
      },
    },
  },
  dasha: {
    intro: "विंशोत्तरी दशा आपके जीवन को ग्रहों के समय में बाँटती है। जिस ग्रह की दशा चल रही होती है, उसका असर आपके अनुभवों पर दिखता है। छोटी दशाएँ देखने के लिए किसी भी दशा पर टैप करें।",
    now: "अभी चल रही दशा",
    levels: ["महादशा", "अंतर्दशा", "प्रत्यंतर दशा", "सूक्ष्म दशा", "प्राण दशा"],
    planet: "ग्रह", start: "आरंभ", end: "समाप्ति", back: "वापस", current: "अभी", open: "छोटी दशाएँ देखें",
    meaning: "यह समय आपके लिए क्या लाता है",
  },
  disclaimer: "यह रिपोर्ट सामान्य वैदिक ज्योतिष नियमों से अपने-आप बनाई गई है। पूर्ण फलादेश में योग, वर्ग कुंडलियाँ और आपकी व्यक्तिगत स्थिति भी देखी जाती है — व्यक्तिगत मार्गदर्शन के लिए परामर्श बुक करें।",
};

export const REPORT: Record<ReadingLang, ReportText> = { en, hi };

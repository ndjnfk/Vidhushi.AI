// Long-form explainer + FAQ shown below each service page (see
// components/ServiceInfo.tsx). Markdown: "## " headings, "- " lists,
// [text](/path) links. Each FAQ question lives on one page only.

export interface Faq {
  q: string;
  a: string;
}

export interface ServiceContent {
  markdown: string;
  faqs: Faq[];
}

export const KUNDLI: ServiceContent = {
  markdown: `
## What is a Kundli?

A Kundli (also called a Janam Kundli or Vedic birth chart) is a map of the sky at the exact moment and place you were born. It shows where the Sun, Moon, planets and the rising sign (Lagna) were placed across the twelve houses of the zodiac. In Vedic astrology this chart is the starting point for understanding your nature, your strengths, the challenges you are likely to meet and the timing of important events in life — career, marriage, finances, health and family.

Vidushi Ji's free Kundli is calculated live from your birth date, birth time and birth place using the sidereal zodiac with the Lahiri ayanamsa, the system followed by most Indian astrologers.

## What your free Kundli includes

- **Rashi chart (D1)** — your main birth chart, in both North Indian and South Indian styles.
- **Navamsa chart (D9)** — the divisional chart used to judge marriage, partnership and the real strength of each planet.
- **Planet positions** — sign, degree, house, nakshatra and pada for every planet, with exalted, debilitated and own-sign placements marked.
- **Vimshottari Dasha** — the timeline of planetary periods (Mahadasha and Antardasha) that shows which planet is shaping your life now and what comes next.
- **Panchang of your birth day** — tithi, vara, nakshatra, yoga and karana.
- **Dosha check** — Manglik dosha, Kaal Sarp dosha, Sade Sati and Dhaiya, and Pitra dosha, explained in plain language.

## How to read your chart

Start with three things: your **Lagna** (ascendant), which describes your body, personality and the overall direction of life; your **Moon sign and nakshatra**, which describe your mind and emotions and are used for Dasha and matching; and the **current Mahadasha**, which tells you which planet's themes are most active right now. The twelve houses then show different areas of life — the 7th for marriage, the 10th for career, the 2nd and 11th for money, and so on.

## Doshas, explained without fear

A dosha is not a curse. It is a placement that needs attention, and many doshas are reduced or cancelled by other factors in the chart.

- **Manglik dosha** is checked from the Lagna, the Moon and Venus. Your report also lists cancellation rules that apply, and shows whether the dosha is strong, mild or cancelled.
- **Kaal Sarp dosha** is formed when all planets fall on one side of the Rahu–Ketu axis.
- **Sade Sati** is Saturn's seven-and-a-half-year transit over your Moon sign; **Dhaiya** is its shorter two-and-a-half-year transit.
- **Pitra dosha** is linked to afflictions of the Sun and the 9th house.

If your report shows a dosha, read the explanation first, then compare it with [Guna Milan](/matching) if you are checking a match. For remedies chosen for your own chart, a personal consultation is the right next step.

## Free Kundli or personal consultation?

The free Kundli gives you accurate calculations and a clear overview. A personal consultation with Vidushi Ji goes further: she reads the whole chart together — houses, aspects, divisional charts and running Dasha — and answers your specific questions about career, marriage, timing and remedies. See [services and pricing](/pricing) to book one.
`,
  faqs: [
    {
      q: "Is the Kundli on Vidushi Ji really free?",
      a: "Yes. The birth chart, Navamsa chart, planet positions, Vimshottari Dasha, birth-day Panchang and the dosha check are all generated free of charge. You only pay if you choose to book a personal consultation.",
    },
    {
      q: "I don't know my exact birth time. Can I still make a Kundli?",
      a: "You can, but some parts will be less reliable. Planet signs and most nakshatras change slowly, so they are usually right. The Lagna changes roughly every two hours, and the houses, Navamsa chart and Dasha dates depend on it. Use the closest time you know (a birth certificate or hospital record is best) and treat house-based results with caution.",
    },
    {
      q: "What is the difference between the North Indian and South Indian chart?",
      a: "Both show exactly the same planetary positions — only the layout differs. In the North Indian chart the houses are fixed and the signs move; in the South Indian chart the signs are fixed and the houses move. Choose whichever style you are used to reading.",
    },
    {
      q: "What is Vimshottari Dasha and why does it matter?",
      a: "Vimshottari Dasha is a 120-year cycle of planetary periods that starts from the nakshatra of your Moon at birth. Each Mahadasha (major period) is divided into Antardashas (sub-periods). The planet whose period is running strongly colours that phase of life, which is why astrologers use it to time events like marriage, a new job or relocation.",
    },
    {
      q: "Which ayanamsa and zodiac does this Kundli use?",
      a: "It uses the sidereal zodiac with the Lahiri (Chitrapaksha) ayanamsa, the standard in Indian Vedic astrology and the one used by the Indian government's Panchang. Western astrology uses the tropical zodiac, which is why your sign may differ between the two systems.",
    },
  ],
};

export const MATCHING: ServiceContent = {
  markdown: `
## What is Guna Milan?

Guna Milan, also called Kundli Milan or Ashtakoot matching, is the traditional Vedic method of checking marriage compatibility. It compares the Moon sign and Moon nakshatra of the bride and groom across eight factors (kootas). Each koota carries a fixed number of points, and together they add up to a maximum of 36 gunas.

## The eight kootas and their points

- **Varna (1 point)** — spiritual and working temperament.
- **Vashya (2 points)** — mutual attraction and influence.
- **Tara (3 points)** — birth-star compatibility, linked to wellbeing and fortune.
- **Yoni (4 points)** — physical and intimate compatibility.
- **Graha Maitri (5 points)** — friendship between the Moon-sign lords; mental wavelength.
- **Gana (6 points)** — nature: Deva, Manushya or Rakshasa.
- **Bhakoot (7 points)** — emotional bond, family welfare and finances.
- **Nadi (8 points)** — health and progeny; the most heavily weighted koota.

## How to read the score

As a general guide, below 18 gunas is traditionally not recommended, 18–24 is acceptable, 25–32 is a good match and 33–36 is excellent. The score is a starting point, not a verdict: a high score with a serious dosha can still need care, and a modest score can work well when the rest of the two charts support each other.

## Nadi, Bhakoot and Manglik dosha

**Nadi dosha** (0 of 8 in Nadi) and **Bhakoot dosha** (0 of 7 in Bhakoot) are the two matching doshas families ask about most. Classical texts list several exceptions that cancel them — for example when the couple's Moon-sign lords are the same or friendly. **Manglik dosha** is not part of the 36 gunas; it is checked separately in each person's [Kundli](/kundli), including the rules that cancel it.

## Beyond the 36 gunas

Guna Milan only compares the Moon. A complete compatibility reading also looks at each person's 7th house and its lord, Venus and Jupiter, the Navamsa (D9) chart and the Dasha periods both partners will be running after marriage. If the score or a dosha worries you, a personal consultation with Vidushi Ji reviews both full charts together — see [services and pricing](/pricing).
`,
  faqs: [
    {
      q: "How many gunas should match for marriage?",
      a: "Traditionally at least 18 out of 36 gunas are considered necessary. 18–24 is acceptable, 25–32 is good and 33–36 is excellent. The total should always be read along with Nadi, Bhakoot and Manglik dosha and the two full charts.",
    },
    {
      q: "Our score is below 18. Should we not marry?",
      a: "Not necessarily. A low score is a signal to look deeper, not an automatic rejection. Check which kootas scored low, whether any dosha is cancelled, and how the 7th house, Venus and Navamsa compare. Many astrologers give more weight to the full charts than to the total alone.",
    },
    {
      q: "What is Nadi dosha and can it be cancelled?",
      a: "Nadi dosha occurs when both partners have the same Nadi (Aadi, Madhya or Antya), giving 0 of 8 points. Classical exceptions can cancel it, such as both being born in the same Moon sign but different nakshatras, or the same nakshatra but different signs. A personal reading confirms whether an exception applies to your charts.",
    },
    {
      q: "Can a Manglik and a non-Manglik person marry?",
      a: "Yes, in many cases. Manglik dosha is often cancelled by other placements in the chart, and its strength varies. When only one partner is Manglik, astrologers check the cancellation rules and the overall charts before advising, and may suggest remedies.",
    },
    {
      q: "Is matching by name as accurate as matching by birth details?",
      a: "No. Name-based matching guesses the nakshatra from the first letter of the name. Matching from the actual birth date, time and place calculates the real Moon nakshatra, so the result is far more reliable. Use exact birth details whenever you have them.",
    },
  ],
};

export const RITUALS: ServiceContent = {
  markdown: `
## How Vidushi Ji's healing rituals work

Healing rituals are spiritual work carried out around one clear intention — health, finance, career, relationships, a legal matter, exams, family, travel or an urgent personal wish. Every ritual starts with a conversation, because the right ritual depends on your situation.

- **Share your intention.** Describe what you are hoping for in your own words.
- **Add the relevant details.** Names, dates and background help Vidushi Ji understand the situation.
- **Mention your timeline.** Tell us if there is a date you are working towards.
- **Choose the ritual.** Vidushi Ji suggests the ritual that best matches your requirement, along with its charges.

## Weekly candle rituals

Weekly candle rituals are intention-based rituals you can start and pay for online. They continue week by week, so you can keep a steady practice around a longer-term goal.

## An honest note

Rituals are offered as spiritual support for your intention. They are not a substitute for medical care, legal advice or financial planning, and no ritual can promise a particular outcome. Please continue to take the practical steps your situation needs alongside any ritual.
`,
  faqs: [
    {
      q: "What details should I share when enquiring about a ritual?",
      a: "Your intention in a few sentences, the people involved, any important dates or deadlines and your preferred timeline. The clearer the picture, the better Vidushi Ji can suggest a suitable ritual.",
    },
    {
      q: "Are rituals charged separately from consultations and tarot sessions?",
      a: "Yes. Ritual charges depend on the ritual chosen and the nature of your intention, and are shared with you before anything is booked.",
    },
    {
      q: "Can a ritual guarantee a result?",
      a: "No. Rituals are spiritual support for your intention, not a guarantee. Outcomes depend on many factors, and rituals should always go hand in hand with practical action and professional advice where needed.",
    },
    {
      q: "How do weekly candle rituals work?",
      a: "You choose a weekly candle ritual for your intention, start it online and pay for it week by week. It is designed for intentions that benefit from steady, ongoing focus rather than a single session.",
    },
  ],
};

export const PRICING: ServiceContent = {
  markdown: `
## How booking works

- **Choose a service** from the list above and tap it to open the booking form.
- **Share your details** — your question, birth details where relevant, and your preferred date and time.
- **Vidushi Ji confirms** your request and the time of your session.
- **Pay to lock the slot** once it is confirmed, using the payment options shown at checkout.
- **Join your session** at the confirmed time through the channel offered for it — chat, audio call or video call — right here on the website.

## What to keep ready

For astrology consultations, keep your exact birth date, birth time and birth place handy (and your partner's, for a compatibility question). Writing down your questions in advance helps you get the most out of the session. You can also prepare by generating your [free Kundli](/kundli) or checking [Guna Milan](/matching) first.
`,
  faqs: [
    {
      q: "When do I pay for a consultation?",
      a: "After Vidushi Ji confirms your request and session time. You then complete the payment to lock in your slot.",
    },
    {
      q: "How does the consultation take place?",
      a: "Online, on this website, through chat, audio call or video call — whichever is offered for your session. You join from your booking at the confirmed time.",
    },
    {
      q: "What information do I need for an astrology consultation?",
      a: "Your exact date, time and place of birth, plus the same details for anyone else your question is about. Without an accurate birth time some parts of the reading are less precise.",
    },
  ],
};

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

export const ABOUT: ServiceContent = {
  markdown: `
## What Vidushi Ji offers

- **Free Kundli** — an accurate Vedic birth chart with Navamsa, Vimshottari Dasha, Panchang and a plain-language dosha check. [Generate yours](/kundli).
- **Guna Milan** — Ashtakoot marriage matching out of 36, with Nadi, Bhakoot and Manglik dosha explained. [Check a match](/matching).
- **Personal consultations** — one-to-one readings by chat, audio or video for questions about career, marriage, relationships, health, finances and timing. [See services and pricing](/pricing).
- **Tarot sessions** — guidance on a specific question or area of life, read from the cards.
- **Healing rituals** — intention-based spiritual work, including weekly candle rituals. [Explore rituals](/rituals).
- **Healing bracelets** — energised and blessed stones, delivered to your door. [Visit the shop](/shop).

## How a reading works

Every consultation begins with your own details — your birth date, time and place for astrology, or your question for tarot. Charts, Dashas and Panchang are calculated precisely from those details, never guessed. Vidushi Ji then reads the whole picture together and explains it in simple words: what the chart shows, which period you are in, and what practical steps or remedies may help.

## What you can expect

- **Honesty over fear.** A dosha or a difficult period is explained calmly, together with what can be done about it.
- **Clear language.** No jargon for its own sake — you should leave a reading understanding your chart better than before.
- **Guidance, not guarantees.** Astrology, tarot and rituals are tools for reflection and spiritual support. They do not replace medical, legal or financial advice.

Have a question before you book? [Contact Vidushi Ji](/contact) or read the [astrology blog](/blog).
`,
  faqs: [
    {
      q: "Who is Vidushi Ji?",
      a: "Vidushi Ji is a Vedic astrologer and tarot reader. Through this website she offers free Kundli and Guna Milan tools, personal consultations by chat, audio or video, tarot sessions, healing rituals and energised healing bracelets.",
    },
    {
      q: "Which system of astrology does Vidushi Ji follow?",
      a: "Classical Vedic (Jyotish) astrology with the sidereal zodiac and the Lahiri ayanamsa, the system used by most astrologers in India. Planetary periods are read with the Vimshottari Dasha system.",
    },
    {
      q: "Do I need an account to use the free Kundli and Guna Milan?",
      a: "No. You can generate a Kundli or check Guna Milan straight away by entering birth details. An account is only needed to book a consultation, enquire about a ritual or place a shop order.",
    },
  ],
};

export const BLOG: ServiceContent = {
  markdown: `
## About this blog

The Vidushi Ji blog explains Vedic astrology in plain language, without jargon or fear. Articles cover the questions people ask most often: what a Kundli shows, how Guna Milan works, what Manglik dosha, Sade Sati or Kaal Sarp dosha really mean, how Dasha periods shape the timing of events, and which remedies are traditionally suggested.

## Start here

- New to astrology? Generate your [free Kundli](/kundli) and read the guide below the form — it explains your Lagna, Moon sign, houses and Dasha.
- Checking a match for marriage? Use [Guna Milan](/matching) and read how the 36 gunas and the Nadi and Bhakoot doshas work.
- Looking for spiritual support for a specific intention? Read about [healing rituals](/rituals).
- Want answers for your own chart? [Book a personal consultation](/pricing) with Vidushi Ji.

## Topics we write about

- **Kundli basics** — Lagna, Moon sign, nakshatras, the twelve houses and how to read a birth chart.
- **Marriage and compatibility** — Guna Milan, Manglik dosha, the 7th house and the Navamsa chart.
- **Timing** — Vimshottari Dasha, Sade Sati, Dhaiya and important planetary transits.
- **Remedies and rituals** — mantras, fasting, charity, gemstones and healing rituals, and when each is traditionally suggested.

Every article is general guidance. Your own chart may show things an article cannot, so for decisions about marriage, career or health, a personal reading is the better guide.
`,
  faqs: [],
};

export const SHOP: ServiceContent = {
  markdown: `
## Healing bracelets, energised for you

Every bracelet and stone in the Vidushi Ji shop is chosen for its traditional meaning, then energised and blessed before it is sent to you. Crystals and gemstones have been worn for centuries as reminders of an intention — calm, love, protection, confidence or focus. Read each product's description to see which stones it uses and what they are traditionally associated with.

## How to choose

- **Start with your intention.** Pick the stone whose traditional meaning matches what you want to work on right now.
- **Keep it simple.** One bracelet worn with a clear intention is better than many worn without one.
- **Not sure?** Ask during a [personal consultation](/pricing) — Vidushi Ji can suggest stones that suit your chart and your question.

## Caring for your bracelet

Take your bracelet off before bathing, swimming or exercising, and keep it away from perfume, soap and chemicals. Store it separately so the stones don't scratch, and wipe it gently with a soft dry cloth.

## Ordering and delivery

Add items to your cart and check out with your delivery address. Depending on your pincode, you either pay the whole amount as **cash on delivery**, or pay a part **online by UPI** first and the rest in cash when the order arrives — the checkout shows which applies before you place the order. Once your order ships, **My Orders** shows its status and courier tracking.

Healing stones are a spiritual practice and a personal reminder of your intention. They are not a substitute for medical treatment.
`,
  faqs: [
    {
      q: "Is cash on delivery available?",
      a: "Yes. For many pincodes the whole order is cash on delivery. For others you pay part of the amount online by UPI when you order and the rest in cash on delivery. The checkout tells you which applies to your address before you confirm.",
    },
    {
      q: "How do I track my order?",
      a: "Log in and open My Orders. Each order shows its current status — placed, confirmed, shipped or delivered — and, once shipped, the courier name and tracking number.",
    },
    {
      q: "What does 'energised' mean?",
      a: "Each bracelet is energised and blessed with an intention before it is packed and sent to you, following traditional spiritual practice. It is a spiritual practice, not a medical treatment.",
    },
  ],
};

export const REVIEWS: ServiceContent = {
  markdown: `
## Reviews from real customers only

Every review on this page comes from a customer who has actually used a Vidushi Ji service. A review can only be written after a consultation or ritual has been **completed**, or after a shop order has been **delivered** — and only once per booking or order. Reviews are shown with the customer's first name and the service they reviewed, newest first.

## Share your experience

Had a consultation, a tarot session, a ritual or a shop order? Log in and open the booking or order. Once it is completed or delivered you will see the option to leave a star rating and a few words. Honest feedback, positive or critical, helps others decide and helps Vidushi Ji improve.

## What clients review

- **Consultations** — astrology readings by chat, audio or video about career, marriage, relationships, health and timing.
- **Tarot sessions** — readings focused on a specific question or area of life.
- **Healing rituals** — intention-based rituals, including weekly candle rituals.
- **Shop orders** — energised healing bracelets and stones, reviewed after delivery.

Want to see what a session is like for yourself? Read about [services and pricing](/pricing), or start with a [free Kundli](/kundli).
`,
  faqs: [
    {
      q: "Are the reviews on this page genuine?",
      a: "Yes. Only customers with a completed consultation or ritual, or a delivered shop order, can write a review, and each booking or order can be reviewed once.",
    },
    {
      q: "How do I leave a review?",
      a: "Log in, open your completed booking or delivered order, and choose a star rating from 1 to 5 with a short comment. Your review appears on this page with your first name.",
    },
  ],
};

export const CONTACT: ServiceContent = {
  markdown: `
## How can we help?

- **Want a personal reading?** You don't need to write first — [book a consultation](/pricing) directly and choose chat, audio or video.
- **Question about an order?** Log in and open **My Orders** to see its status and courier tracking. If something is wrong, send a message with your order number.
- **Question about a ritual?** Use **Enquire about a ritual** on the [rituals page](/rituals) and share your intention and timeline.
- **Anything else?** Use the form on this page, or the phone, email or WhatsApp details shown.

## When you write, please include

- Your name and the email you used on the site.
- Your order number or booking date, if your message is about one.
- For an astrology question: your birth date, time and place.

Vidushi Ji reads every message and replies to your email.

## Quick answers before you write

- **Free tools need no account.** You can generate a [Kundli](/kundli) or check [Guna Milan](/matching) right away, without signing up.
- **Consultation charges** for every service are listed on the [pricing page](/pricing), and you pay only after your session time is confirmed.
- **Forgot your password?** Use "Forgot password" on the login page to reset it with your security question.
`,
  faqs: [],
};

// api/extract.js
import axios from 'axios';
import cheerio from 'cheerio';

export default async function handler(req, res) {
  const pageUrl = req.query.url;
  if (!pageUrl) return res.status(400).json({ error: 'url query param missing' });

  try {
    const { data: html } = await axios.get(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(html);

    // تمام لینک‌های MediaFire
    const rawLinks = $('a[href*="mediafire.com/file/"]')
      .map((_, a) => $(a).attr('href'))
      .get();

    if (rawLinks.length === 0)
      return res.status(404).json({ error: 'No MediaFire links found.' });

    // گروه‌بندی بر اساس CUSA
    const grouped = {};
    rawLinks.forEach(link => {
      // استخراج کد (مثلاً 25186)
      const m = link.match(/[_-](\d{5})[_-]/);
      const cusa = m ? `CUSA${m[1]}` : 'CUSAUNKNOWN';
      if (!grouped[cusa]) grouped[cusa] = [];
      grouped[cusa].push(link);
    });

    res.setHeader('Cache-Control', 's-maxage=3600'); // ۱ساعت
    return res.json(grouped);
  } catch (err) {
    return res.status(500).json({ error: 'fetch/parsing failed', detail: err.message });
  }
}
